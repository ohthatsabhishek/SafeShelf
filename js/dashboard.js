/**
 * SAFESHELF — dashboard.js
 * ------------------------------------------------------------
 * MEMBER 4 MODULE: Dashboard, Categories Explorer, Warranties,
 * Analytics, Notifications & App Navigation Router
 * ------------------------------------------------------------
 * Contains:
 *   - DashboardModule   -> stats widgets, inventory health, notifications,
 *                          triage boards, warranty tracking, and analytics
 *   - CategoriesModule  -> browsable category explorer grid
 *   - NavigationModule  -> 10-screen routing, search/filter wiring,
 *                          profile & logout handlers, modal control
 *   - MobileModule      -> responsive mobile drawer & bottom navigation
 *
 * Depends on: js/auth.js, js/inventory.js, js/features.js
 * Loaded LAST — its final block boots the whole application.
 * ------------------------------------------------------------
 */

  const BackupModule = {
    exportCurrentUser() {
      const user = AuthModule.currentUser;
      if (!user) return showNotification('Please log in before exporting a backup.', 'warning');
      const uid = user.id;
      let allLists = {}; try { allLists = JSON.parse(localStorage.getItem(StorageModule.SHOPPING_LIST_KEY) || '{}'); } catch (_) {}
      const list = Array.isArray(allLists[uid]) ? allLists[uid] : StorageModule.loadShoppingList(uid);
      let suppressed = {}; let dismissed = {};
      try { suppressed = JSON.parse(localStorage.getItem('safeshelf_shopping_suppressed') || '{}'); } catch (_) {}
      try { dismissed = JSON.parse(localStorage.getItem('safeshelf_dismissed_notifications') || '{}'); } catch (_) {}
      const backup = {
        app: 'SafeShelf', version: 1, exportedAt: new Date().toISOString(),
        household: { name: user.name, email: user.email, notificationsEnabled: user.notificationsEnabled !== false, reminderDays: user.reminderDays || 7 },
        inventory: StorageModule.loadProducts(), shoppingList: list,
        shoppingSuppressed: suppressed[uid] || [], dismissedNotifications: dismissed[uid] || []
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `safeshelf-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      showNotification('JSON backup exported.', 'success');
    },
    async importCurrentUser(file) {
      const user = AuthModule.currentUser;
      if (!user || !file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data || data.app !== 'SafeShelf' || data.version !== 1 || !Array.isArray(data.inventory) || !Array.isArray(data.shoppingList)) {
          throw new Error('This file is not a supported SafeShelf JSON backup.');
        }
        const validInventory = data.inventory.every(item => item && typeof item.name === 'string' && typeof item.category === 'string' && item.id !== undefined);
        const validShopping = data.shoppingList.every(item => item && typeof item.name === 'string');
        if (!validInventory || !validShopping) throw new Error('Backup contents failed validation.');
        if (!confirm(`Restore ${data.inventory.length} inventory item(s) and ${data.shoppingList.length} shopping-list item(s)? This replaces the current household inventory and shopping list.`)) return;
        const uid = user.id;
        const importedProducts = data.inventory.map(item => ({ ...item, userId: uid }));
        StorageModule.saveProducts(importedProducts);
        StorageModule.saveShoppingList(uid, data.shoppingList);
        const writeUserMap = (key, value) => {
          let map = {}; try { map = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) {}
          map[uid] = value; localStorage.setItem(key, JSON.stringify(map));
        };
        writeUserMap('safeshelf_shopping_suppressed', Array.isArray(data.shoppingSuppressed) ? data.shoppingSuppressed : []);
        writeUserMap('safeshelf_dismissed_notifications', Array.isArray(data.dismissedNotifications) ? data.dismissedNotifications : []);
        if (data.household) {
          user.notificationsEnabled = data.household.notificationsEnabled !== false;
          user.reminderDays = [3,7,14,30].includes(Number(data.household.reminderDays)) ? Number(data.household.reminderDays) : 7;
          AuthModule.currentUser = user;
          localStorage.setItem(AuthModule.CURRENT_USER_KEY, JSON.stringify(user));
          const users = AuthModule.getUsers(); const index = users.findIndex(entry => entry.id === uid);
          if (index >= 0) { users[index].notificationsEnabled = user.notificationsEnabled; users[index].reminderDays = user.reminderDays; localStorage.setItem(AuthModule.USERS_KEY, JSON.stringify(users)); }
        }
        products = StorageModule.loadProducts();
        if (typeof ShoppingListModule !== 'undefined' && ShoppingListModule.syncShoppingList) ShoppingListModule.syncShoppingList(products);
        if (typeof DashboardModule !== 'undefined') { DashboardModule.updateDashboardMetrics(products); DashboardModule.renderWarrantyTracker(products); DashboardModule.renderFullNotifications(products); DashboardModule.updateNotifications(products); }
        showNotification('Backup restored successfully.', 'success');
      } catch (error) { showNotification(error.message || 'Could not restore this backup.', 'error'); }
    },
    init() {
      const exportBtn = document.getElementById('exportBackupBtn');
      const importBtn = document.getElementById('importBackupBtn');
      const fileInput = document.getElementById('importBackupFile');
      if (exportBtn) exportBtn.onclick = () => this.exportCurrentUser();
      if (importBtn && fileInput) importBtn.onclick = () => fileInput.click();
      if (fileInput) fileInput.onchange = async () => { const file = fileInput.files && fileInput.files[0]; await this.importCurrentUser(file); fileInput.value = ''; };
    }
  };

  const NotificationState = {
    KEY: 'safeshelf_dismissed_notifications',
    getDismissed(userId) {
      if (!userId) return [];
      try { const data = JSON.parse(localStorage.getItem(this.KEY) || '{}'); return Array.isArray(data[userId]) ? data[userId] : []; }
      catch (_) { return []; }
    },
    dismiss(userId, key) {
      if (!userId || !key) return;
      try {
        const data = JSON.parse(localStorage.getItem(this.KEY) || '{}');
        const list = Array.isArray(data[userId]) ? data[userId] : [];
        if (!list.includes(key)) list.push(key);
        data[userId] = list;
        localStorage.setItem(this.KEY, JSON.stringify(data));
      } catch (error) { console.error('Could not save dismissed notifications', error); }
    }
  };

  const DashboardModule = {
    // Calculates days remaining between today and target date with safe error handling
    getDaysRemaining(targetDateStr) {
      if (!targetDateStr || typeof targetDateStr !== 'string') return Infinity;
      // Date-only values (YYYY-MM-DD) represent a calendar date, not UTC midnight.
      // Construct them in local time to avoid off-by-one errors west of UTC.
      let target;
      const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(targetDateStr);
      if (dateOnly) {
        target = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
        // Reject invalid dates such as 2026-02-31 rather than silently normalizing them.
        if (target.getFullYear() !== Number(dateOnly[1]) ||
            target.getMonth() !== Number(dateOnly[2]) - 1 ||
            target.getDate() !== Number(dateOnly[3])) return Infinity;
      } else {
        target = new Date(targetDateStr);
      }
      if (isNaN(target.getTime())) return Infinity;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);

      const diffTime = target.getTime() - today.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    },

    // Gets human-readable status & badge class
    getItemStatus(expiryDateStr) {
      const days = this.getDaysRemaining(expiryDateStr);
      if (days === Infinity) return { text: 'Safe', class: 'badge-safe' };
      if (days < 0) return { text: 'Expired', class: 'badge-danger' };
      if (days <= 7) return { text: 'Expiring Soon', class: 'badge-warning' };
      return { text: 'Safe', class: 'badge-safe' };
    },

    // Recalculates all high-level dashboard metrics
    updateDashboardMetrics(productsList) {
      const total = productsList.length;
      let expiredCount = 0;
      let expiringSoonCount = 0;
      let warrantyEndingCount = 0;

      // Unique categories counter
      const categories = new Set();

      productsList.forEach(item => {
        if (item.category) categories.add(item.category);

        const expiryDays = this.getDaysRemaining(item.expiryDate);
        if (expiryDays !== Infinity) {
          if (expiryDays < 0) {
            expiredCount++;
          } else if (expiryDays <= 7) {
            expiringSoonCount++;
          }
        }

        if (item.warrantyDate) {
          const warrantyDays = this.getDaysRemaining(item.warrantyDate);
          if (warrantyDays >= 0 && warrantyDays <= 30) {
            warrantyEndingCount++;
          }
        }
      });

      // Render stats into DOM
      const elTotal = document.getElementById('metricTotal');
      const elExp = document.getElementById('metricExpiring');
      const elDead = document.getElementById('metricExpired');
      const elCat = document.getElementById('metricCategories');

      if (elTotal) elTotal.textContent = total;
      if (elExp) elExp.textContent = expiringSoonCount;
      if (elDead) elDead.textContent = expiredCount;
      if (elCat) elCat.textContent = categories.size;

      // SAFE FORMULA: Ensure no double-counting between expired and expiring soon
      const attentionCount = expiredCount + expiringSoonCount;
      const safeCount = Math.max(0, total - attentionCount);
      
      let healthPercentage = 100;
      if (total > 0) {
        healthPercentage = Math.round((safeCount / total) * 100);
      }
      healthPercentage = Math.max(0, Math.min(100, healthPercentage)); // clamp 0-100
      
      const dashboardHealthEl = document.getElementById('dashboardHealthPercentage');
      if (dashboardHealthEl) {
        if (total === 0) {
          dashboardHealthEl.textContent = '100%';
        } else {
          dashboardHealthEl.textContent = healthPercentage + '%';
        }
      }
      
      const dashboardBarEl = document.getElementById('dashboardHealthProgressBar');
      if (dashboardBarEl) {
        dashboardBarEl.style.width = healthPercentage + '%';
      }
      
      const dashboardTrackedEl = document.getElementById('dashboardHealthTrackedText');
      if (dashboardTrackedEl) {
        dashboardTrackedEl.textContent = total === 0 ? '0 products tracked' : `${safeCount} of ${total} items safely fresh`;
      }
      
      const dashboardAttentionTextEl = document.getElementById('dashboardHealthAttentionText');
      if (dashboardAttentionTextEl) {
        if (total === 0) {
          dashboardAttentionTextEl.textContent = 'Add products to begin shelf monitoring.';
          dashboardAttentionTextEl.style.color = 'var(--text-muted)';
        } else if (attentionCount > 0) {
          dashboardAttentionTextEl.textContent = `${attentionCount} item(s) require your attention`;
          dashboardAttentionTextEl.style.color = 'var(--status-warn-text)';
        } else {
          dashboardAttentionTextEl.textContent = '✓ All items in shelf are fresh and safe';
          dashboardAttentionTextEl.style.color = 'var(--status-safe-text)';
        }
      }

      // Concise Editorial Household Summary
      const subtitleEl = document.getElementById('dashboardHeroSubtitle');
      if (subtitleEl) {
        if (total === 0) {
          subtitleEl.textContent = 'Household shelf is empty. Add your first grocery item to begin.';
        } else if (expiredCount > 0 || expiringSoonCount > 0) {
          const parts = [`${total} item${total === 1 ? '' : 's'} tracked`];
          if (expiringSoonCount > 0) parts.push(`${expiringSoonCount} expiring soon`);
          if (expiredCount > 0) parts.push(`${expiredCount} expired`);
          subtitleEl.textContent = parts.join(' · ') + ' — prompt attention recommended.';
        } else {
          subtitleEl.textContent = `${total} items tracked · All pantry stock is safely fresh.`;
        }
      }

      // Attention Count Pill
      const attentionBadge = document.getElementById('attentionCountBadge');
      if (attentionBadge) {
        attentionBadge.textContent = `${attentionCount} item${attentionCount === 1 ? '' : 's'}`;
        attentionBadge.className = attentionCount > 0 ? (expiredCount > 0 ? 'badge badge-danger' : 'badge badge-warning') : 'badge badge-safe';
      }

      this.updateNeedsAttention(productsList);
      this.updateNotifications(productsList);
      this.renderExpiryTracker(productsList);
      this.renderWarrantyTracker(productsList);
      this.renderAnalytics(productsList);
      this.renderFullNotifications(productsList);
    },

    // Updates Dashboard "Needs Attention" List (Main Focal Point)
    updateNeedsAttention(productsList) {
      let attentionItems = [];
      for (let i = 0; i < productsList.length; i++) {
        const item = productsList[i];
        const days = this.getDaysRemaining(item.expiryDate);
        if (days !== Infinity && days <= 30) {
          attentionItems.push(item);
        }
      }

      attentionItems.sort((a, b) => {
        return this.getDaysRemaining(a.expiryDate) - this.getDaysRemaining(b.expiryDate);
      });

      const listContainer = document.getElementById('needsAttentionList');
      if (!listContainer) return;
      listContainer.innerHTML = '';

      if (attentionItems.length === 0) {
        listContainer.innerHTML = `
          <div style="padding: 28px 16px; color: var(--status-safe-text); text-align: center; font-size: 13px; font-weight: 600; border: 1px dashed var(--border-hairline); border-radius: var(--radius); background: var(--surface-panel);">
            ✓ All clear!
            <span style="color: var(--text-muted); font-size: 12px; font-weight: 400; margin-top: 4px; display: block;">No products currently need attention. All tracked inventory is fresh.</span>
          </div>`;
      } else {
        const displayLimit = 6;
        const topAttention = attentionItems.slice(0, displayLimit);
        topAttention.forEach(item => {
          const days = this.getDaysRemaining(item.expiryDate);
          const status = this.getItemStatus(item.expiryDate);
          
          let daysText = days < 0 ? `${Math.abs(days)}d expired` : (days === 0 ? 'Expires today' : (days === 1 ? 'Expires tomorrow' : `${days}d left`));
          
          const thumbMarkup = (typeof InventoryModule !== 'undefined' && InventoryModule.getThumbnailMarkup) 
            ? InventoryModule.getThumbnailMarkup(item) 
            : '';

          const div = document.createElement('div');
          div.className = 'attention-feed-item';
          div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
              ${thumbMarkup}
              <div style="min-width: 0; display: flex; flex-direction: column;">
                <span class="attention-product-name" title="${item.name}">${item.name}</span>
                <span class="attention-product-meta">
                  <span class="attention-cat-pill">${item.category}</span>
                  <span class="attention-meta-dot">·</span>
                  <span>${item.quantity}</span>
                </span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
              <span class="badge ${status.class}">${daysText}</span>
              <button type="button" class="table-btn table-btn-shop action-shop" data-id="${item.id}" title="Add to Shopping List">+ List</button>
            </div>
          `;
          listContainer.appendChild(div);
        });

        if (attentionItems.length > displayLimit) {
          const footerDiv = document.createElement('div');
          footerDiv.className = 'attention-feed-more-bar';
          footerDiv.innerHTML = `
            <a href="#" onclick="window.navigateToView('expiring'); return false;" style="font-size: 11.5px; font-weight: 600; color: var(--primary-forest);">
              + ${attentionItems.length - displayLimit} more urgent item(s) in Expiry Tracker &rarr;
            </a>
          `;
          listContainer.appendChild(footerDiv);
        }

        // Wire quick shop buttons inside attention list
        listContainer.querySelectorAll('.action-shop').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const item = products.find(p => p.id === id);
            if (item && typeof ShoppingListModule !== 'undefined') {
              ShoppingListModule.addItem({
                id: item.id,
                productId: item.id,
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                source: 'manual',
                reason: 'manual'
              });
              btn.textContent = '✓ Added';
              btn.style.color = 'var(--primary-forest)';
              setTimeout(() => { btn.textContent = '+ List'; btn.style.color = ''; }, 1200);
            }
          };
        });
      }
    },

    // Updates Header Notification Dropdown
    updateNotifications(productsList) {
      const notifList = document.getElementById('notifList');
      const notifBadge = document.getElementById('notifBadge');
      
      const notifsEnabled = AuthModule.currentUser && AuthModule.currentUser.notificationsEnabled !== false;
      const reminderDays = AuthModule.currentUser && AuthModule.currentUser.reminderDays ? AuthModule.currentUser.reminderDays : 7;
      let badgeCount = 0;

      if (!notifsEnabled) {
        if (notifList) notifList.innerHTML = '<li class="dropdown-empty">Notifications are paused in Settings.</li>';
        if (notifBadge) notifBadge.style.display = 'none';
        return;
      }

      let notificationItems = [];
      for (let i = 0; i < productsList.length; i++) {
        const item = productsList[i];
        const days = this.getDaysRemaining(item.expiryDate);
        if (days !== Infinity && days <= reminderDays) {
          notificationItems.push(item);
        }
      }

      notificationItems.sort((a, b) => {
        return this.getDaysRemaining(a.expiryDate) - this.getDaysRemaining(b.expiryDate);
      });

      if (notifList) {
        notifList.innerHTML = '';
        if (notificationItems.length === 0) {
          notifList.innerHTML = '<li class="dropdown-empty">No urgent notifications. All safe.</li>';
        } else {
          notificationItems.forEach(item => {
            const days = this.getDaysRemaining(item.expiryDate);
            let daysText = days < 0 ? 'Already expired' : (days === 0 ? 'Expires today' : `Expires in ${days} days`);
            const li = document.createElement('li');
            li.className = 'dropdown-item';
            li.innerHTML = `
              <div style="font-weight: 600; font-size: 12px;">${item.name}</div>
              <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px;">${daysText} (${item.category})</div>
            `;
            li.onclick = () => {
              NavigationModule.navigateToView('expiring');
            };
            notifList.appendChild(li);
            badgeCount++;
          });
        }
      }

      if (notifBadge) {
        if (badgeCount > 0) {
          notifBadge.style.display = 'flex';
          notifBadge.textContent = badgeCount;
        } else {
          notifBadge.style.display = 'none';
        }
      }
    },

    // Renders the dedicated 3-column Expiry Tracker board
    renderExpiryTracker(productsList) {
      const expiredList = document.getElementById('expiryListExpired');
      const urgentList = document.getElementById('expiryListUrgent');
      const upcomingList = document.getElementById('expiryListUpcoming');

      const countExpiredEl = document.getElementById('expiryCountExpired');
      const countUrgentEl = document.getElementById('expiryCountUrgent');
      const countUpcomingEl = document.getElementById('expiryCountUpcoming');

      if (!expiredList || !urgentList || !upcomingList) return;

      expiredList.innerHTML = '';
      urgentList.innerHTML = '';
      upcomingList.innerHTML = '';

      let cExpired = 0;
      let cUrgent = 0;
      let cUpcoming = 0;

      productsList.forEach(item => {
        const days = this.getDaysRemaining(item.expiryDate);
        if (days === Infinity) return;

        const card = document.createElement('div');
        card.className = 'expiry-item-card';

        let badgeClass = 'badge-safe';
        let countdownLabel = `${days}d left`;

        if (days < 0) {
          badgeClass = 'badge-danger';
          countdownLabel = `${Math.abs(days)}d expired`;
        } else if (days <= 3) {
          badgeClass = 'badge-warning';
          countdownLabel = days === 0 ? 'Expires today' : `${days}d left`;
        } else if (days <= 7) {
          badgeClass = 'badge-warning';
          countdownLabel = `${days}d left`;
        }

        card.innerHTML = `
          <div class="expiry-item-card-header">
            <div>
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">${item.category}</span>
              <h4 style="font-size: 12.5px; font-weight: 700; color: var(--text-primary); margin: 1px 0 3px;">${item.name}</h4>
              <span style="font-size: 11px; color: var(--text-secondary); font-family: var(--font-mono);">${item.quantity}</span>
            </div>
            <span class="badge ${badgeClass}">${countdownLabel}</span>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border-hairline);">
            <button type="button" class="table-btn table-btn-shop action-shop" data-id="${item.id}" style="flex: 1.2;">+ List</button>
            <button type="button" class="table-btn table-btn-secondary action-view" data-id="${item.id}">View</button>
          </div>
        `;

        if (days < 0) {
          expiredList.appendChild(card);
          cExpired++;
        } else if (days <= 3) {
          urgentList.appendChild(card);
          cUrgent++;
        } else if (days <= 7) {
          upcomingList.appendChild(card);
          cUpcoming++;
        }
      });

      if (countExpiredEl) countExpiredEl.textContent = cExpired;
      if (countUrgentEl) countUrgentEl.textContent = cUrgent;
      if (countUpcomingEl) countUpcomingEl.textContent = cUpcoming;

      if (cExpired === 0) expiredList.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 11.5px;">No expired items. Excellent!</div>';
      if (cUrgent === 0) urgentList.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 11.5px;">No urgent items expiring in 0–3 days.</div>';
      if (cUpcoming === 0) upcomingList.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 11.5px;">No upcoming items expiring in 4–7 days.</div>';

      // Attach actions
      document.querySelectorAll('#expiringView .action-view').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          InventoryModule.showProductDetails(btn.dataset.id);
        };
      });
      document.querySelectorAll('#expiringView .action-shop').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const item = products.find(p => p.id === btn.dataset.id);
          if (item && typeof ShoppingListModule !== 'undefined') {
            ShoppingListModule.addItem({
              id: item.id,
              productId: item.id,
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              source: 'manual',
              reason: 'manual'
            });
            btn.textContent = '✓ Added';
            btn.style.color = 'var(--primary-forest)';
            setTimeout(() => { btn.textContent = '+ List'; btn.style.color = ''; }, 1200);
          }
        };
      });
    },

    // Renders the dedicated Warranty Tracker view
    renderWarrantyTracker(productsList) {
      const tbody = document.getElementById('warrantyTableBody');
      const elTotal = document.getElementById('warrantyMetricTotal');
      const elActive = document.getElementById('warrantyMetricActive');
      const elExpiring = document.getElementById('warrantyMetricExpiring');
      const elExpired = document.getElementById('warrantyMetricExpired');

      const warranties = productsList.filter(p => p.warrantyDate && p.warrantyDate.trim() !== '');

      let cActive = 0;
      let cExpiring = 0;
      let cExpired = 0;

      if (tbody) {
        tbody.innerHTML = '';
        if (warranties.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No appliances or warranties currently registered. Set "Warranty End" when adding products.</td></tr>`;
        } else {
          warranties.forEach(item => {
            const wDays = this.getDaysRemaining(item.warrantyDate);
            let statusBadge = '';

            if (wDays < 0) {
              cExpired++;
              statusBadge = '<span class="badge badge-danger">Expired</span>';
            } else if (wDays <= 30) {
              cExpiring++;
              statusBadge = `<span class="badge badge-warning">Expiring in ${wDays}d</span>`;
            } else {
              cActive++;
              statusBadge = `<span class="badge badge-safe">Active (${wDays}d)</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><strong>${item.name}</strong></td>
              <td>${item.category}</td>
              <td>${item.quantity}</td>
              <td><span style="font-family: var(--font-mono);">${item.warrantyDate}</span></td>
              <td>${statusBadge}</td>
              <td style="text-align: right;">
                <button type="button" class="table-btn table-btn-secondary action-view" data-id="${item.id}">View</button>
              <button type="button" class="table-btn table-btn-secondary action-edit-warranty" data-id="${item.id}">Edit</button>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      }

      if (elTotal) elTotal.textContent = warranties.length;
      if (elActive) elActive.textContent = cActive;
      if (elExpiring) elExpiring.textContent = cExpiring;
      if (elExpired) elExpired.textContent = cExpired;

      document.querySelectorAll('#warrantyView .action-view').forEach(btn => {
        btn.onclick = () => InventoryModule.showProductDetails(btn.dataset.id);
      });
      document.querySelectorAll('#warrantyView .action-edit-warranty').forEach(btn => {
        btn.onclick = () => InventoryModule.setupEditMode(btn.dataset.id);
      });
    },

    // Renders the dedicated Analytics view
    renderAnalytics(productsList) {
      const circleEl = document.getElementById('analyticsHealthCircle');
      const ratioEl = document.getElementById('analyticsHealthRatio');
      const startEl = document.getElementById('analyticsSessionStart');
      const addedEl = document.getElementById('analyticsSessionAdded');
      const searchEl = document.getElementById('analyticsSessionSearches');
      const barEl = document.getElementById('analyticsCategoryBar');
      const legendEl = document.getElementById('analyticsCategoryLegend');

      const total = productsList.length;
      let attentionCount = 0;
      const catCounts = {};

      productsList.forEach(p => {
        const st = this.getItemStatus(p.expiryDate);
        if (st.text !== 'Safe') attentionCount++;
        const c = p.category || 'Other';
        catCounts[c] = (catCounts[c] || 0) + 1;
      });

      const safeCount = Math.max(0, total - attentionCount);
      let pct = total > 0 ? Math.round((safeCount / total) * 100) : 100;
      pct = Math.max(0, Math.min(100, pct));

      if (circleEl) circleEl.textContent = `${pct}%`;
      if (ratioEl) ratioEl.textContent = `${safeCount} fresh / ${total} total tracked items`;

      // Session stats
      if (typeof SessionModule !== 'undefined') {
        const stats = SessionModule.getStats();
        if (startEl) {
          const sDate = new Date(stats.sessionStart);
          startEl.textContent = sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (addedEl) addedEl.textContent = stats.itemsAdded;
        if (searchEl) searchEl.textContent = stats.searchesRun;
      }

      // Category distribution matrix
      if (barEl && legendEl) {
        barEl.innerHTML = '';
        legendEl.innerHTML = '';

        const catColors = {
          'Fruits': '#E11D48',
          'Vegetables': '#16A34A',
          'Dairy': '#0284C7',
          'Cleaning': '#8B5CF6',
          'Food Grains': '#D97706',
          'Condiments': '#F97316',
          'Cosmetics': '#EC4899',
          'Appliances': '#6366F1',
          'Medicine': '#EF4444',
          'Other': '#6B7280'
        };

        if (total === 0) {
          barEl.innerHTML = '<div style="width: 100%; height: 100%; background: var(--surface-subdued);"></div>';
          legendEl.innerHTML = '<span style="color: var(--text-muted);">No products tracked yet.</span>';
        } else {
          Object.keys(catCounts).forEach(cat => {
            const count = catCounts[cat];
            const segPct = Math.round((count / total) * 100);
            const color = catColors[cat] || '#6B7280';

            const seg = document.createElement('div');
            seg.className = 'dist-segment';
            seg.style.width = `${segPct}%`;
            seg.style.backgroundColor = color;
            seg.title = `${cat}: ${count} (${segPct}%)`;
            barEl.appendChild(seg);

            const leg = document.createElement('div');
            leg.className = 'dist-legend-item';
            leg.innerHTML = `<span class="dist-dot" style="background-color: ${color};"></span> <span>${cat} (<strong>${count}</strong>)</span>`;
            legendEl.appendChild(leg);
          });
        }
      }
    },

    // Renders the dedicated Notifications feed
    renderFullNotifications(productsList) {
      const container = document.getElementById('fullNotificationFeed');
      if (!container) return;
      container.innerHTML = '';

      let alerts = [];
      const uid = AuthModule.currentUser && AuthModule.currentUser.id;
      const dismissed = NotificationState.getDismissed(uid);

      productsList.forEach(item => {
        const days = this.getDaysRemaining(item.expiryDate);
        if (days !== Infinity && days <= 7 && !dismissed.includes(`expiry:${item.id}`)) {
          alerts.push({
            type: 'expiry',
            item: item,
            urgent: days <= 1,
            title: item.name,
            message: days < 0 ? `Product expired ${Math.abs(days)} day(s) ago` : (days === 0 ? 'Product expires today' : `Product expires in ${days} day(s)`),
            badge: days < 0 ? 'badge-danger' : 'badge-warning'
          });
        }

        const qtyNum = StorageModule.getNumericQuantity(item.quantity);
        if (qtyNum !== null && qtyNum <= 1 && !dismissed.includes(`stock:${item.id}`)) {
          alerts.push({
            type: 'stock',
            item: item,
            urgent: qtyNum === 0,
            title: item.name,
            message: qtyNum === 0 ? 'Product is completely out of stock (Qty: 0)' : `Product is running low (Current: ${item.quantity})`,
            badge: qtyNum === 0 ? 'badge-danger' : 'badge-warning'
          });
        }
      });

      if (alerts.length === 0) {
        container.innerHTML = `
          <div style="padding: 32px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
            ✓ No pending alerts. Current alerts can be dismissed individually.
          </div>
        `;
      } else {
        alerts.forEach(alert => {
          const card = document.createElement('div');
          card.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--surface-subdued); border: 1px solid var(--border-hairline); border-radius: var(--radius); gap: 12px;';
          card.innerHTML = `
            <div>
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">${alert.type === 'expiry' ? 'Shelf Life Alert' : 'Stock Alert'}</span>
              <h4 style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 2px 0;">${alert.title}</h4>
              <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">${alert.message}</p>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" class="table-btn table-btn-shop action-shop" data-id="${alert.item.id}">+ List</button>
              <button type="button" class="table-btn table-btn-secondary action-view" data-id="${alert.item.id}">View</button>
              <button type="button" class="table-btn table-btn-secondary action-dismiss" data-alert-key="${alert.type}:${alert.item.id}">Dismiss</button>
            </div>
          `;
          container.appendChild(card);
        });

        container.querySelectorAll('.action-shop').forEach(btn => {
          btn.onclick = () => {
            const item = products.find(p => p.id === btn.dataset.id);
            if (item && typeof ShoppingListModule !== 'undefined') {
              ShoppingListModule.addItem({
                id: item.id,
                productId: item.id,
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                source: 'manual',
                reason: 'manual'
              });
              btn.textContent = '✓ Added';
              btn.style.color = 'var(--primary-forest)';
              setTimeout(() => { btn.textContent = '+ List'; btn.style.color = ''; }, 1200);
            }
          };
        });

        container.querySelectorAll('.action-view').forEach(btn => {
          btn.onclick = () => InventoryModule.showProductDetails(btn.dataset.id);
        });
        container.querySelectorAll('.action-dismiss').forEach(btn => {
          btn.onclick = () => {
            NotificationState.dismiss(uid, btn.dataset.alertKey);
            this.renderFullNotifications(productsList);
            this.updateNotifications(productsList);
          };
        });
      }
    },

    // Sorting algorithm
    sortProducts(productsList, field, direction) {
      return [...productsList].sort((a, b) => {
        let valA = a[field] || '';
        let valB = b[field] || '';

        if (field === 'quantity') {
          valA = StorageModule.getNumericQuantity(valA);
          valB = StorageModule.getNumericQuantity(valB);
        } else {
          valA = valA.toString().toLowerCase();
          valB = valB.toString().toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
  };


  // ==========================================
  // CATEGORIES HIERARCHY & EXPLORER MODULE
  // ==========================================
  const CategoriesModule = {
    activeCategoryFilter: 'all',

    init() {
      const searchInput = document.getElementById('categoryCatalogSearch');
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          this.render(searchInput.value);
        });
      }
      this.render();
    },

    render(searchQuery = '') {
      const container = document.getElementById('categoriesContentArea');
      const chipsContainer = document.getElementById('categoryNavigationChips');
      if (!container || !chipsContainer) return;

      const q = searchQuery.toLowerCase().trim();
      const categories = CatalogStore.getCategories();

      // Render category filter chips
      chipsContainer.innerHTML = '';
      
      const allChip = document.createElement('button');
      allChip.type = 'button';
      allChip.className = `category-nav-chip ${this.activeCategoryFilter === 'all' ? 'active' : ''}`;
      allChip.innerHTML = `<span>All</span>`;
      allChip.onclick = () => {
        this.activeCategoryFilter = 'all';
        this.render(searchQuery);
      };
      chipsContainer.appendChild(allChip);

      categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `category-nav-chip ${this.activeCategoryFilter === cat.id ? 'active' : ''}`;
        chip.innerHTML = `<span>${cat.name}</span>`;
        chip.onclick = () => {
          this.activeCategoryFilter = cat.id;
          this.render(searchQuery);
        };
        chipsContainer.appendChild(chip);
      });

      // Filter and render category cards
      container.innerHTML = '';
      let sectionsFound = 0;

      categories.forEach(cat => {
        if (this.activeCategoryFilter !== 'all' && this.activeCategoryFilter !== cat.id) {
          return;
        }

        let matchingProducts = cat.products;
        if (q) {
          matchingProducts = cat.products.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.brand && p.brand.toLowerCase().includes(q)) || 
            (p.description && p.description.toLowerCase().includes(q))
          );
        }

        if (matchingProducts.length === 0) return;
        sectionsFound++;

        const section = document.createElement('div');
        section.className = 'content-card';
        section.style.marginBottom = '20px';

        let gridHtml = '';
        matchingProducts.forEach(prod => {
          gridHtml += `
            <div class="retail-card" style="margin-bottom: 0;">
              <div class="retail-card-header">
                <span class="retail-card-cat-pill">${cat.name}</span>
                <span class="retail-card-date">~${prod.suggestedShelfLifeDays}d life</span>
              </div>
              <div class="retail-card-image-box">
                ${prod.image ? `<img src="${prod.image}" alt="${prod.name}" class="retail-card-img" onerror="this.parentElement.innerHTML='<span class=\\'retail-card-monogram\\'>${prod.name.slice(0,2).toUpperCase()}</span>'">` : `<span class="retail-card-monogram">${prod.name.slice(0,2).toUpperCase()}</span>`}
              </div>
              <div class="retail-card-content">
                <h4 class="retail-card-title">${prod.name}</h4>
                <div class="retail-card-meta">
                  <span class="retail-card-qty">~${prod.defaultQuantity}</span>
                </div>
              </div>
              <div class="retail-card-actions">
                <button type="button" class="table-btn table-btn-secondary cat-add-btn" data-id="${prod.id}" style="flex: 1;">+ Add</button>
                <button type="button" class="table-btn table-btn-shop cat-shop-btn" data-id="${prod.id}" style="flex: 1;">+ List</button>
              </div>
            </div>
          `;
        });

        section.innerHTML = `
          <div class="card-header">
            <h3 class="card-title">${cat.name} (${matchingProducts.length})</h3>
            <a href="#" class="cat-jump-inventory" data-cat="${cat.name}" style="font-size: 11.5px; font-weight: 600; color: var(--primary-forest);">View in Inventory &rarr;</a>
          </div>
          <div class="retail-product-grid" style="margin-bottom: 0;">
            ${gridHtml}
          </div>
        `;

        section.querySelectorAll('.cat-add-btn').forEach(btn => {
          btn.onclick = () => {
            const p = CatalogStore.getProductById(btn.dataset.id);
            if (p) WebApiModule.showCatalogProductPreview(p, 'Catalog');
          };
        });

        section.querySelectorAll('.cat-shop-btn').forEach(btn => {
          btn.onclick = () => {
            const p = CatalogStore.getProductById(btn.dataset.id);
            if (p && typeof ShoppingListModule !== 'undefined') {
              ShoppingListModule.addItem({
                name: p.name,
                category: cat.name,
                quantity: p.defaultQuantity,
                source: 'manual',
                reason: 'manual'
              });
              btn.textContent = '✓ Added';
              btn.style.color = 'var(--primary-forest)';
              setTimeout(() => { btn.textContent = '+ List'; btn.style.color = ''; }, 1200);
            }
          };
        });

        const jumpLink = section.querySelector('.cat-jump-inventory');
        if (jumpLink) {
          jumpLink.onclick = (e) => {
            e.preventDefault();
            NavigationModule.navigateToView('inventory', { category: cat.name });
          };
        }

        container.appendChild(section);
      });

      if (sectionsFound === 0) {
        container.innerHTML = `
          <div style="padding: 48px; text-align: center; color: var(--text-muted); border: 1px dashed var(--border-hairline); border-radius: var(--radius);">
            No matching products or departments found.
          </div>
        `;
      }
    }
  };


  // ==========================================
  // NAVIGATION ROUTER (ALL 10 DEDICATED SCREENS)
  // ==========================================
  const NavigationModule = {
    navigateToView(viewName, options = {}) {
      if (typeof MobileModule !== 'undefined') MobileModule.close();
      
      // 1. Switch Active Section DOM Node
      this.switchView(viewName);

      // 2. Update Sidebar Active State
      document.querySelectorAll('#appSidebar .nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll(`#appSidebar .nav-item[data-view="${viewName}"]`).forEach(a => a.classList.add('active'));

      // 3. Update Bottom Nav Active State
      document.querySelectorAll('.bottom-nav .bottom-nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll(`.bottom-nav .bottom-nav-item[data-view="${viewName}"]`).forEach(a => a.classList.add('active'));

      // 4. Close open dropdowns
      const notifDrop = document.getElementById('notifDropdown');
      if (notifDrop) notifDrop.classList.remove('show');
      const profDrop = document.getElementById('profileDropdown');
      if (profDrop) profDrop.classList.remove('show');

      // 5. Execute Screen-Specific Logic
      if (viewName === 'inventory') {
        const searchInput = document.getElementById('searchInput');
        const catSelect = document.getElementById('categoryFilter');
        const stSelect = document.getElementById('statusFilter');

        if (searchInput && options.search !== undefined) searchInput.value = options.search;
        if (catSelect && options.category !== undefined) catSelect.value = options.category;
        if (stSelect && options.status !== undefined) stSelect.value = options.status;

        InventoryModule.renderProductTable(products);

        if (options.addMode) {
          InventoryModule.setupAddMode();
        }
      } 
      else if (viewName === 'expiring') {
        DashboardModule.renderExpiryTracker(products);
      }
      else if (viewName === 'shopping') {
        ShoppingListModule.renderShoppingList();
      }
      else if (viewName === 'categories') {
        CategoriesModule.render();
      }
      else if (viewName === 'warranty') {
        DashboardModule.renderWarrantyTracker(products);
      }
      else if (viewName === 'analytics') {
        DashboardModule.renderAnalytics(products);
      }
      else if (viewName === 'notifications') {
        DashboardModule.renderFullNotifications(products);
      }
      else if (viewName === 'profile') {
        if (AuthModule.currentUser) {
          const emailInput = document.getElementById('profileEmail');
          if (emailInput) emailInput.value = AuthModule.currentUser.email;
          const nameInput = document.getElementById('profileName');
          if (nameInput) nameInput.value = AuthModule.currentUser.name;
          const msg = document.getElementById('profileMessage');
          if (msg) msg.textContent = '';
        }
      }
    },

    switchView(viewName) {
      document.querySelectorAll('.view-section').forEach(section => {
        if (section.id === `${viewName}View`) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });
    },

    init() {
      if (typeof BackupModule !== 'undefined') BackupModule.init();
      // Sidebar Navigation Click Binding
      document.querySelectorAll('#appSidebar .nav-item').forEach(item => {
        item.onclick = (e) => {
          e.preventDefault();
          this.navigateToView(item.dataset.view);
        };
      });

      // Bottom Nav Click Binding
      document.querySelectorAll('.bottom-nav .bottom-nav-item').forEach(item => {
        item.onclick = (e) => {
          e.preventDefault();
          this.navigateToView(item.dataset.view);
        };
      });

      // Notification Dropdown Toggle
      const notifBtn = document.getElementById('notifBtn');
      const notifDropdown = document.getElementById('notifDropdown');
      if (notifBtn && notifDropdown) {
        notifBtn.onclick = (e) => {
          e.stopPropagation();
          notifDropdown.classList.toggle('show');
          const profDrop = document.getElementById('profileDropdown');
          if (profDrop) profDrop.classList.remove('show');
        };
      }

      // Profile Dropdown Toggle
      const profileBtn = document.getElementById('profileBtn');
      const profileDropdown = document.getElementById('profileDropdown');
      if (profileBtn && profileDropdown) {
        profileBtn.onclick = (e) => {
          e.stopPropagation();
          profileDropdown.classList.toggle('show');
          if (notifDropdown) notifDropdown.classList.remove('show');
        };
      }

      // Global click closes dropdowns
      document.addEventListener('click', () => {
        if (notifDropdown) notifDropdown.classList.remove('show');
        if (profileDropdown) profileDropdown.classList.remove('show');
      });

      // Visit Profile / Settings
      const visitProfileBtn = document.getElementById('visitProfileBtn');
      if (visitProfileBtn) {
        visitProfileBtn.onclick = (e) => {
          e.preventDefault();
          this.navigateToView('profile');
        };
      }

      const navProfileItem = document.getElementById('navProfileItem');
      if (navProfileItem) {
        navProfileItem.onclick = (e) => {
          e.preventDefault();
          this.navigateToView('profile');
        };
      }

      // Logout handler
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.onclick = () => {
          showConfirm('Sign Out?', 'Are you sure you want to log out of SafeShelf?', () => {
            AuthModule.logout();
          }, 'Sign Out');
        };
      }

      // Clear Inventory logic
      const clearInventoryBtn = document.getElementById('clearInventoryBtn');
      if (clearInventoryBtn) {
        clearInventoryBtn.onclick = () => {
          showConfirm(
            'Clear Inventory?',
            'This will permanently remove all products from your shelf. This cannot be undone.',
            () => {
              StorageModule.saveProducts([]);
              products = StorageModule.loadProducts();
              InventoryModule.renderProductTable(products);
              DashboardModule.updateDashboardMetrics(products);
              if (typeof ShoppingListModule !== 'undefined') {
                ShoppingListModule.syncShoppingList(products);
              }
              showNotification('Inventory wiped clean.', 'success');
            },
            'Clear Inventory'
          );
        };
      }

      // Search & Filters Input Listeners
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.oninput = () => InventoryModule.renderProductTable(products);
      }
      const categoryFilter = document.getElementById('categoryFilter');
      if (categoryFilter) {
        categoryFilter.onchange = () => InventoryModule.renderProductTable(products);
      }
      const statusFilter = document.getElementById('statusFilter');
      if (statusFilter) {
        statusFilter.onchange = () => InventoryModule.renderProductTable(products);
      }

      // Sort Columns Listeners
      document.querySelectorAll('th[data-sort]').forEach(th => {
        th.onclick = () => {
          const field = th.getAttribute('data-sort');
          if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            sortField = field;
            sortDirection = 'asc';
          }
          InventoryModule.renderProductTable(products);
        };
      });

      // Close Details Modal
      const closeModal = document.getElementById('closeModal');
      if (closeModal) {
        closeModal.onclick = () => document.getElementById('detailsModal').classList.remove('show');
      }
      const closeModalFooter = document.getElementById('closeModalFooter');
      if (closeModalFooter) {
        closeModalFooter.onclick = () => document.getElementById('detailsModal').classList.remove('show');
      }

      // Global Escape listener for modals and drawer
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const detailsModal = document.getElementById('detailsModal');
          if (detailsModal) detailsModal.classList.remove('show');
          const confirmModal = document.getElementById('confirmModal');
          if (confirmModal) confirmModal.classList.remove('show');
          if (typeof InventoryModule !== 'undefined') InventoryModule.closeDrawer();
        }
      });
    }
  };

  // Expose global navigation router for inline HTML triggers
  window.navigateToView = (view, options) => NavigationModule.navigateToView(view, options);


  // ==========================================
  // MOBILE NAVIGATION MODULE
  // ==========================================
  const MobileModule = {
    init() {
      this.menuBtn = document.getElementById('mobileMenuBtn');
      this.sidebar = document.getElementById('appSidebar');
      this.overlay = document.getElementById('mobileOverlay');

      if (!this.menuBtn || !this.sidebar || !this.overlay) return;

      this.menuBtn.onclick = (e) => {
        e.stopPropagation();
        this.toggle();
      };

      this.overlay.onclick = () => {
        this.close();
      };
    },

    toggle() {
      if (this.sidebar.classList.contains('drawer-open')) {
        this.close();
      } else {
        this.open();
      }
    },

    open() {
      this.sidebar.classList.add('drawer-open');
      this.overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    },

    close() {
      if (this.sidebar) this.sidebar.classList.remove('drawer-open');
      if (this.overlay) this.overlay.classList.remove('show');
      document.body.style.overflow = '';
    }
  };

// ==========================================
// APPLICATION BOOTSTRAP
// ==========================================
NavigationModule.init();
MobileModule.init();
WebApiModule.init();
CategoriesModule.init();
ShoppingListModule.init();
DashboardModule.updateDashboardMetrics(products);
InventoryModule.renderProductTable(products);

// Background sync from MongoDB if logged in
if (AuthModule.currentUser && localStorage.getItem('safeshelf_auth_token')) {
  StorageModule.syncFromServer().then(synced => {
    if (synced) {
      products = StorageModule.loadProducts();
      DashboardModule.updateDashboardMetrics(products);
      InventoryModule.renderProductTable(products);
      if (typeof ShoppingListModule !== 'undefined' && ShoppingListModule.renderShoppingList) {
        ShoppingListModule.renderShoppingList();
      }
    }
  });
}
