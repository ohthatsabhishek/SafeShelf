/**
 * SAFESHELF — dashboard.js
 * ------------------------------------------------------------
 * Dashboard, Categories Explorer & App Navigation
 * ------------------------------------------------------------
 * Contains:
 *   - DashboardModule   -> stats widgets, inventory health, notifications,
 *                          reduce()/filter()/sort() based calculations
 *   - CategoriesModule  -> browsable category explorer grid
 *   - NavigationModule  -> sidebar/bottom-nav routing, search/filter/sort
 *                          wiring, profile & logout handlers, modal control
 *   - MobileModule      -> responsive mobile drawer menu
 *
 * Depends on: js/auth.js, js/inventory.js, js/features.js
 * Loaded LAST — its final block boots the whole application.
 * ------------------------------------------------------------
 */

  const DashboardModule = {
    // Calculates days remaining between today and target date
    getDaysRemaining(targetDateStr) {
      if (!targetDateStr) return Infinity;
      const today = new Date();
      today.setHours(0,0,0,0);
      const target = new Date(targetDateStr);
      target.setHours(0,0,0,0);
      
      const diffTime = target.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // Gets human-readable status & badge class
    getItemStatus(expiryDateStr) {
      const days = this.getDaysRemaining(expiryDateStr);
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
        if (expiryDays < 0) {
          expiredCount++;
        } else if (expiryDays <= 7) {
          expiringSoonCount++;
        }

        if (item.warrantyDate) {
          const warrantyDays = this.getDaysRemaining(item.warrantyDate);
          if (warrantyDays >= 0 && warrantyDays <= 30) {
            warrantyEndingCount++;
          }
        }
      });

      // Render stats into DOM
      document.getElementById('metricTotal').textContent = total;
      document.getElementById('metricExpiring').textContent = expiringSoonCount;
      document.getElementById('metricExpired').textContent = expiredCount;
      document.getElementById('metricCategories').textContent = categories.size;

      const attentionCount = expiredCount + expiringSoonCount;
      const safeCount = total - attentionCount;
      
      let healthPercentage = 100;
      if (total > 0) {
        healthPercentage = Math.round((safeCount / total) * 100);
      }
      healthPercentage = Math.max(0, Math.min(100, healthPercentage)); // clamp
      
      const dashboardHealthEl = document.getElementById('dashboardHealthPercentage');
      if (dashboardHealthEl) {
        if (total === 0) {
          dashboardHealthEl.textContent = 'No products yet';
          dashboardHealthEl.style.fontSize = '24px';
        } else {
          dashboardHealthEl.textContent = healthPercentage + '%';
          dashboardHealthEl.style.fontSize = '36px';
        }
      }
      
      const dashboardBarEl = document.getElementById('dashboardHealthProgressBar');
      if (dashboardBarEl) {
        dashboardBarEl.style.width = (total === 0 ? 0 : healthPercentage) + '%';
      }
      
      const dashboardTrackedEl = document.getElementById('dashboardHealthTrackedText');
      if (dashboardTrackedEl) dashboardTrackedEl.textContent = total === 0 ? '0 products tracked' : `${safeCount} products safely tracked`;
      
      const dashboardAttentionTextEl = document.getElementById('dashboardHealthAttentionText');
      if (dashboardAttentionTextEl) {
        if (total === 0) {
          dashboardAttentionTextEl.textContent = 'Add products to calculate inventory health.';
          dashboardAttentionTextEl.parentElement.style.color = 'var(--text-muted)';
        } else if (attentionCount > 0) {
          dashboardAttentionTextEl.textContent = `${attentionCount} products need your attention`;
          dashboardAttentionTextEl.parentElement.style.color = 'var(--warning)';
        } else {
          dashboardAttentionTextEl.textContent = 'All products are safe';
          dashboardAttentionTextEl.parentElement.style.color = 'var(--text-muted)';
        }
      }

      this.updateNeedsAttention(productsList);
      this.updateNotifications(productsList);
    },

    updateProfileHealth(productsList) {
      let attentionCount = 0;
      productsList.forEach(p => {
        const statusInfo = this.getItemStatus(p.expiryDate);
        if (statusInfo.text !== 'Safe') {
          attentionCount++;
        }
      });
      const safeCount = productsList.length - attentionCount;
      let healthPercentage = 100;
      if (productsList.length > 0) {
        healthPercentage = Math.round((safeCount / productsList.length) * 100);
      }
      healthPercentage = Math.max(0, Math.min(100, healthPercentage)); // clamp
      
      const healthEl = document.getElementById('healthPercentage');
      if (healthEl) {
        if (productsList.length === 0) {
          healthEl.textContent = 'No products yet';
          healthEl.style.fontSize = '24px';
        } else {
          healthEl.textContent = healthPercentage + '%';
          healthEl.style.fontSize = '36px';
        }
      }
      
      const barEl = document.getElementById('healthProgressBar');
      if (barEl) barEl.style.width = productsList.length === 0 ? '0%' : healthPercentage + '%';
      
      const trackedEl = document.getElementById('healthTrackedText');
      if (trackedEl) trackedEl.textContent = productsList.length === 0 ? '0 products tracked' : `${safeCount} products safely tracked`;
      
      const attentionTextEl = document.getElementById('healthAttentionText');
      if (attentionTextEl) {
        if (productsList.length === 0) {
          attentionTextEl.textContent = 'Add products to calculate inventory health.';
          attentionTextEl.parentElement.style.color = 'var(--text-muted)';
        } else if (attentionCount > 0) {
          attentionTextEl.textContent = `${attentionCount} products need your attention`;
          attentionTextEl.parentElement.style.color = 'var(--warning)';
        } else {
          attentionTextEl.textContent = 'All products are safe';
          attentionTextEl.parentElement.style.color = 'var(--text-muted)';
        }
      }
    },

    updateNotifications(productsList) {
      const notifList = document.getElementById('notifList');
      const notifBadge = document.getElementById('notifBadge');
      
      const notifsEnabled = AuthModule.currentUser && AuthModule.currentUser.notificationsEnabled !== false;
      const reminderDays = AuthModule.currentUser && AuthModule.currentUser.reminderDays ? AuthModule.currentUser.reminderDays : 7;
      let badgeCount = 0;

      if (!notifsEnabled) {
        if (notifList) notifList.innerHTML = '<li class="dropdown-empty">Expiry notifications are turned off.</li>';
        if (notifBadge) {
          notifBadge.style.display = 'none';
          notifBadge.textContent = '0';
        }
      } else {
        const notificationItems = productsList.filter(item => {
          const days = this.getDaysRemaining(item.expiryDate);
          return days <= reminderDays;
        }).sort((a, b) => {
          return this.getDaysRemaining(a.expiryDate) - this.getDaysRemaining(b.expiryDate);
        });

        if (notifList) notifList.innerHTML = '';
        if (notificationItems.length === 0) {
          if (notifList) notifList.innerHTML = '<li class="dropdown-empty">No notifications</li>';
        } else {
          notificationItems.forEach(item => {
            const days = this.getDaysRemaining(item.expiryDate);
            let daysText = days < 0 ? 'Already expired' : (days === 0 ? 'Expires today' : (days === 1 ? 'Expires tomorrow' : `Expires in ${days} days`));
            if (notifList) {
              const li = document.createElement('li');
              li.className = 'dropdown-item';
              li.innerHTML = `
                <div style="font-weight: 600;">${item.name}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${daysText}</div>
              `;
              notifList.appendChild(li);
            }
            badgeCount++;
          });
        }

        if (notifBadge) {
          if (badgeCount > 0) {
            notifBadge.style.display = 'flex';
            notifBadge.textContent = badgeCount;
          } else {
            notifBadge.style.display = 'none';
          }
        }
      }
    },

    updateNeedsAttention(productsList) {
      const attentionItems = productsList.filter(item => {
        const days = this.getDaysRemaining(item.expiryDate);
        return days <= 30; // 30 days is safe, <=30 is Expiring Soon / Urgent / Expired
      }).sort((a, b) => {
        const daysA = this.getDaysRemaining(a.expiryDate);
        const daysB = this.getDaysRemaining(b.expiryDate);
        return daysA - daysB; // Most urgent first
      });

      const needsAttentionList = document.getElementById('needsAttentionList');
      
      if (!needsAttentionList) return;
      
      needsAttentionList.innerHTML = '';

      if (attentionItems.length === 0) {
        needsAttentionList.innerHTML = `
          <div style="padding: 24px 16px; color: var(--primary); text-align: center; font-size: 16px; font-weight: 600;">
            ✓ All clear!
            <span style="color: var(--text-muted); font-size: 14px; font-weight: 400; margin-top: 8px; display: block;">No products currently require attention.</span>
          </div>`;
      } else {
        // Limit to 5 items on Dashboard
        const dashboardAttentionItems = attentionItems.slice(0, 5);
        dashboardAttentionItems.forEach(item => {
          const days = this.getDaysRemaining(item.expiryDate);
          const status = this.getItemStatus(item.expiryDate);
          
          let daysText = days < 0 ? 'Already expired' : (days === 0 ? 'Expires today' : (days === 1 ? 'Expires tomorrow' : `Expires in ${days} days`));
          
          const div = document.createElement('div');
          div.className = 'attention-item';
          div.innerHTML = `
            <div class="attention-info">
              <span class="attention-title">${item.name}</span>
              <span class="attention-meta">${daysText}</span>
            </div>
            <span class="badge ${status.class}">${status.text}</span>
          `;
          needsAttentionList.appendChild(div);
        });
      }
    },

    // Sorting algorithm
    sortProducts(productsList, field, direction) {
      return [...productsList].sort((a, b) => {
        let valA = a[field] || '';
        let valB = b[field] || '';

        // Clean up or parse numeric values if quantity is sorted
        if (field === 'quantity') {
          valA = parseFloat(valA) || 0;
          valB = parseFloat(valB) || 0;
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

      const clearBtn = document.getElementById('categoriesClearSearch');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
          }
          this.render();
        });
      }

      this.render();
    },

    render(searchQuery = '') {
      const container = document.getElementById('categoriesContentArea');
      const chipsContainer = document.getElementById('categoryNavigationChips');
      const clearBtn = document.getElementById('categoriesClearSearch');
      if (!container || !chipsContainer) return;

      const q = searchQuery.toLowerCase().trim();

      // Show/hide clear search button
      if (clearBtn) {
        clearBtn.style.display = q ? 'flex' : 'none';
      }

      const categories = CatalogStore.getCategories();

      // Render category filter chips
      chipsContainer.innerHTML = '';
      
      // "All" chip
      const allChip = document.createElement('button');
      allChip.type = 'button';
      allChip.className = `category-nav-chip ${this.activeCategoryFilter === 'all' ? 'active' : ''}`;
      allChip.setAttribute('aria-pressed', this.activeCategoryFilter === 'all' ? 'true' : 'false');
      allChip.innerHTML = `<span class="category-chip-icon">🗂️</span> <span class="category-chip-name">All</span>`;
      allChip.addEventListener('click', () => {
        this.activeCategoryFilter = 'all';
        this.render(searchQuery);
      });
      chipsContainer.appendChild(allChip);

      categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `category-nav-chip ${this.activeCategoryFilter === cat.id ? 'active' : ''}`;
        chip.setAttribute('aria-pressed', this.activeCategoryFilter === cat.id ? 'true' : 'false');
        chip.innerHTML = `<span class="category-chip-icon">${cat.icon}</span> <span class="category-chip-name">${cat.name}</span>`;
        chip.addEventListener('click', () => {
          this.activeCategoryFilter = cat.id;
          this.render(searchQuery);
        });
        chipsContainer.appendChild(chip);
      });

      // Filter and render category sections
      container.innerHTML = '';
      let visibleSectionsCount = 0;

      categories.forEach(cat => {
        // Chip filter: Skip category if it's not the selected one
        if (this.activeCategoryFilter !== 'all' && this.activeCategoryFilter !== cat.id) {
          return;
        }

        // Search query filtering
        let matchingProducts = cat.products;
        if (q) {
          const matchCat = cat.name.toLowerCase().includes(q) || (cat.description && cat.description.toLowerCase().includes(q));
          if (!matchCat) {
            matchingProducts = cat.products.filter(p => 
              p.name.toLowerCase().includes(q) || 
              (p.brand && p.brand.toLowerCase().includes(q)) || 
              (p.description && p.description.toLowerCase().includes(q)) ||
              p.tags.some(t => t.toLowerCase().includes(q))
            );
          }
        }

        // If no products match in this category under search, hide the section
        if (matchingProducts.length === 0) {
          return;
        }

        visibleSectionsCount++;
        const trackedCount = products.filter(item => item.category === cat.name).length;

        const section = document.createElement('section');
        section.className = 'category-section';
        section.style.setProperty('--cat-accent', cat.color);

        let gridHtml = '';
        matchingProducts.forEach(product => {
          const placeholder = cat.icon || '📦';
          
          gridHtml += `
            <div class="category-product-card" data-id="${product.id}" tabindex="0" role="button" aria-label="View details of ${product.name}">
              <div class="category-product-image-wrapper">
                ${product.image ? 
                  `<img src="${product.image}" alt="${product.name}" class="category-product-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                  ''
                }
                <div class="category-product-placeholder" style="${product.image ? 'display:none;' : 'display:flex;'}">${placeholder}</div>
              </div>
              
              <div class="category-product-info">
                <span class="category-product-brand">${product.brand || 'Generic'}</span>
                <h4 class="category-product-title">${product.name}</h4>
                <div class="category-product-meta">
                  <span>Quantity: ${product.defaultQuantity}</span>
                  <span>Shelf Life: ~${product.suggestedShelfLifeDays} days</span>
                </div>
              </div>

              <div class="category-product-actions">
                <button type="button" class="category-btn-add" data-id="${product.id}" aria-label="Add ${product.name} to inventory">
                  + Add
                </button>
                <button type="button" class="category-btn-shop" data-id="${product.id}" aria-label="Add ${product.name} to shopping list" title="Add to Shopping List">
                  🛒
                </button>
              </div>
            </div>
          `;
        });

        section.innerHTML = `
          <div class="category-section-header">
            <div class="category-section-title-group">
              <span class="category-section-icon">${cat.icon}</span>
              <div>
                <div style="display: flex; align-items: center;">
                  <h3 class="category-section-name">${cat.name}</h3>
                  <span class="category-section-count" title="${trackedCount} currently tracked">${matchingProducts.length} catalog / ${trackedCount} tracked</span>
                </div>
                <p class="category-section-desc">${cat.description || ''}</p>
              </div>
            </div>
            <div class="category-section-actions">
              <a href="#" class="cat-view-inventory-link" data-category="${cat.name}">View in Inventory &rarr;</a>
            </div>
          </div>
          <div class="category-product-grid">
            ${gridHtml}
          </div>
        `;

        // Event listeners
        section.querySelectorAll('.category-product-card').forEach(card => {
          card.addEventListener('click', (e) => {
            // Stop if action buttons are clicked
            if (e.target.closest('.category-product-actions')) return;
            const productId = card.dataset.id;
            const product = CatalogStore.getProductById(productId);
            if (product) {
              WebApiModule.showCatalogProductPreview(product, 'Catalog');
            }
          });

          card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              card.click();
            }
          });
        });

        section.querySelectorAll('.category-btn-add').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.id;
            const product = CatalogStore.getProductById(productId);
            if (product) {
              WebApiModule.showCatalogProductPreview(product, 'Catalog');
            }
          });
        });

        section.querySelectorAll('.category-btn-shop').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.id;
            const product = CatalogStore.getProductById(productId);
            if (product) {
              if (typeof ShoppingListModule !== 'undefined') {
                ShoppingListModule.addItem({
                  name: product.name,
                  category: cat.name,
                  quantity: product.defaultQuantity,
                  source: 'manual',
                  reason: 'manual'
                });
                btn.textContent = '✓';
                btn.style.backgroundColor = 'var(--primary-light)';
                btn.style.color = 'var(--primary)';
                btn.style.borderColor = 'var(--primary)';
                setTimeout(() => { 
                  btn.textContent = '🛒';
                  btn.style.backgroundColor = '';
                  btn.style.color = '';
                  btn.style.borderColor = '';
                }, 1500);
              }
            }
          });
        });

        section.querySelector('.cat-view-inventory-link').addEventListener('click', (e) => {
          e.preventDefault();
          NavigationModule.navigateToView('inventory', { category: cat.name });
        });

        container.appendChild(section);
      });

      // Polished Empty State
      if (visibleSectionsCount === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'category-empty-state';
        emptyState.innerHTML = `
          <div class="category-empty-state-icon">🔍</div>
          <h3>No products found</h3>
          <p>Try another search or browse all categories.</p>
          <button type="button" class="btn btn-outline btn-sm" id="categoryEmptyClearBtn">Clear Search</button>
        `;
        emptyState.querySelector('#categoryEmptyClearBtn').addEventListener('click', () => {
          const searchInput = document.getElementById('categoryCatalogSearch');
          if (searchInput) {
            searchInput.value = '';
          }
          this.render();
        });
        container.appendChild(emptyState);
      }
    }
  };

  // ==========================================
  // VIEW NAVIGATION & SEARCH/SORT ROUTING
  // ==========================================
  const NavigationModule = {
    navigateToView(viewName, options = {}) {
      if (typeof MobileModule !== 'undefined') MobileModule.close();
      
      // 1. Determine actual DOM view to show
      let targetDOMView = viewName;
      if (viewName === 'expiring') {
        targetDOMView = 'inventory';
      }
      this.switchView(targetDOMView);

      // 2. Update active navigation item visually
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll(`.nav-item[data-view="${viewName}"]`).forEach(activeNav => {
        activeNav.classList.add('active');
      });

      // 3. Close open dropdowns/menus
      const notifDropdown = document.getElementById('notifDropdown');
      if (notifDropdown) notifDropdown.classList.remove('show');
      const profileDropdown = document.getElementById('profileDropdown');
      if (profileDropdown) profileDropdown.classList.remove('show');

      // 4. Handle View-Specific Logic
      const searchInput = document.getElementById('searchInput');
      const categoryFilter = document.getElementById('categoryFilter');
      const statusFilter = document.getElementById('statusFilter');

      const welcome = document.querySelector('#inventoryView .welcome-section h1');
      const desc = document.querySelector('#inventoryView .welcome-section p');

      if (viewName === 'dashboard') {
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'All Categories';
        if (statusFilter) statusFilter.value = 'All Statuses';
      } 
      else if (viewName === 'inventory') {
        if (searchInput) searchInput.value = options.search ?? '';
        if (categoryFilter) categoryFilter.value = options.category ?? 'All Categories';
        if (statusFilter) statusFilter.value = options.status ?? 'All Statuses';
        if (welcome) welcome.textContent = 'Product Inventory';
        if (desc) desc.textContent = 'View, filter, sort and manage all products stored in your home.';
        InventoryModule.renderProductTable(products);

        if (options.addMode) {
          InventoryModule.cancelEdit();
          document.getElementById('inventoryFormSection').scrollIntoView({ behavior: 'smooth' });
        }
      } 
      else if (viewName === 'shopping') {
        ShoppingListModule.renderShoppingList();
      }
      else if (viewName === 'categories') {
        if (typeof CategoriesModule !== 'undefined') {
          CategoriesModule.render();
        }
      }
      else if (viewName === 'expiring') {
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'All Categories';
        if (statusFilter) statusFilter.value = 'Expiring Soon';
        if (welcome) welcome.textContent = 'Expiring Soon';
        if (desc) desc.textContent = 'Items requiring your attention within the next 7 days.';
        InventoryModule.renderProductTable(products);
      } 
      // 'profile' doesn't alter inventory filters
    },

    init() {
      // Sidebar Links Navigation
      document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const targetView = item.getAttribute('data-view');
          this.navigateToView(targetView);
        });
      });

      document.querySelectorAll('.stats-card[role="button"]').forEach(card => {
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
          }
        });
      });

      // Dropdown Listeners
      const notifBtn = document.getElementById('notifBtn');
      const notifDropdown = document.getElementById('notifDropdown');
      if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          notifDropdown.classList.toggle('show');
          const profileDrop = document.getElementById('profileDropdown');
          if (profileDrop) profileDrop.classList.remove('show');
        });
      }

      const profileBtn = document.getElementById('profileBtn');
      const profileDropdown = document.getElementById('profileDropdown');
      if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          profileDropdown.classList.toggle('show');
          if (notifDropdown) notifDropdown.classList.remove('show');
        });
      }

      document.addEventListener('click', () => {
        if (notifDropdown) notifDropdown.classList.remove('show');
        if (profileDropdown) profileDropdown.classList.remove('show');
      });

      // Visit Profile
      const visitProfileBtn = document.getElementById('visitProfileBtn');
      if (visitProfileBtn) {
        visitProfileBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.navigateToView('profile');
          if (AuthModule.currentUser) {
            const emailInput = document.getElementById('profileEmail');
            if (emailInput) emailInput.value = AuthModule.currentUser.email;
            const nameInput = document.getElementById('profileName');
            if (nameInput) nameInput.value = AuthModule.currentUser.name;
            const messageEl = document.getElementById('profileMessage');
            if (messageEl) messageEl.textContent = '';
            
            const profilePageName = document.getElementById('profilePageName');
            if (profilePageName) profilePageName.textContent = AuthModule.currentUser.name;
            const profilePageEmail = document.getElementById('profilePageEmail');
            if (profilePageEmail) profilePageEmail.textContent = AuthModule.currentUser.email;
            const profilePageAvatar = document.getElementById('profilePageAvatar');
            if (profilePageAvatar) profilePageAvatar.textContent = AuthModule.currentUser.name.charAt(0).toUpperCase();
            
            const currentProducts = StorageModule.loadProducts();
            DashboardModule.updateProfileHealth(currentProducts);
          }
          if (profileDropdown) profileDropdown.classList.remove('show');
          document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        });
      }

      // Logout handler
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to logout?')) {
            AuthModule.logout();
          }
        });
      }

      // Clear Inventory logic
      const clearInventoryBtn = document.getElementById('clearInventoryBtn');
      if (clearInventoryBtn) {
        clearInventoryBtn.addEventListener('click', () => {
          if (confirm('Are you sure? This will permanently remove all products from your inventory.')) {
            StorageModule.saveProducts([]); 
            products = StorageModule.loadProducts();
            
            InventoryModule.renderProductTable(products);
            DashboardModule.updateDashboardMetrics(products);
            DashboardModule.updateProfileHealth(products);
            if (typeof ShoppingListModule !== 'undefined') {
              ShoppingListModule.syncShoppingList(products);
            }
            
            // show inline success message in the page
            const messageEl = document.getElementById('profileMessage');
            if (messageEl) {
              messageEl.style.color = 'var(--primary)';
              messageEl.textContent = 'Your inventory has been cleared.';
            }
          }
        });
      }

      // Search & Filters listeners
      document.getElementById('searchInput').addEventListener('input', () => {
        InventoryModule.renderProductTable(products);
      });
      document.getElementById('categoryFilter').addEventListener('change', () => {
        InventoryModule.renderProductTable(products);
      });
      document.getElementById('statusFilter').addEventListener('change', () => {
        InventoryModule.renderProductTable(products);
      });

      // Sort table columns
      document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
          const field = th.getAttribute('data-sort');
          if (sortField === field) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            sortField = field;
            sortDirection = 'asc';
          }
          
          InventoryModule.renderProductTable(products);
        });
      });

      // Close modal events
      document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('detailsModal').classList.remove('show');
      });
      document.getElementById('closeModalFooter').addEventListener('click', () => {
        document.getElementById('detailsModal').classList.remove('show');
      });

      // Global Escape key modal closer
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.getElementById('detailsModal').classList.remove('show');
        }
      });
    },

    switchView(viewName) {
      document.querySelectorAll('.view-section').forEach(section => {
        const isMatch = section.id === `${viewName}View` || 
                        (viewName === 'shopping' && (section.id === 'shoppingView' || section.id === 'shoppingListView'));
        if (isMatch) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });
    }
  };

  // Expose for HTML inline handlers
  window.navigateToView = (view, options) => NavigationModule.navigateToView(view, options);


  const MobileModule = {
    init() {
      this.menuBtn = document.getElementById('mobileMenuBtn');
      this.sidebar = document.getElementById('appSidebar');
      this.overlay = document.getElementById('mobileOverlay');

      if (!this.menuBtn || !this.sidebar || !this.overlay) return;

      this.menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });

      this.overlay.addEventListener('click', () => {
        this.close();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.sidebar.classList.contains('drawer-open')) {
          this.close();
        }
      });
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
      this.menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden'; 
      
      const notifDropdown = document.getElementById('notifDropdown');
      if (notifDropdown) notifDropdown.classList.remove('show');
      const profileDropdown = document.getElementById('profileDropdown');
      if (profileDropdown) profileDropdown.classList.remove('show');
    },

    close() {
      if (this.sidebar) this.sidebar.classList.remove('drawer-open');
      if (this.overlay) this.overlay.classList.remove('show');
      if (this.menuBtn) this.menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  };

// ==========================================
// APPLICATION BOOTSTRAP
// Runs after ALL four files (auth.js, inventory.js, features.js,
// dashboard.js) have finished defining every module & the shared
// `products` array has been loaded from localStorage.
// ==========================================
NavigationModule.init();
MobileModule.init();
WebApiModule.init();
CategoriesModule.init();
ShoppingListModule.init();
DashboardModule.updateDashboardMetrics(products);
InventoryModule.renderProductTable(products);
