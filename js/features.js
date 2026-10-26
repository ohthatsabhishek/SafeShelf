/**
 * SAFESHELF — features.js
 * ------------------------------------------------------------
 * MEMBER 3 MODULE: Smart Features — REST API Integration & Shopping List
 * ------------------------------------------------------------
 * Contains:
 *   - WebApiModule      -> fetch() + async/await REST API consumption
 *                           (DummyJSON public API) with graceful fallback
 *                           to CatalogStore, and error handling (Topics 25-30)
 *   - ShoppingListModule -> auto-generated + manually-added shopping list,
 *                           built with array methods (Topics 11-14)
 *
 * Depends on: js/auth.js, js/inventory.js
 * Loaded after inventory.js, before dashboard.js.
 * ------------------------------------------------------------
 */

  const WebApiModule = {
    selectedCategory: 'All',

    // Safe Category Mapper: Maps API categories to SafeShelf categories
    // Rule: Generic API products are NEVER mapped to 'Medicine' for consumer safety.
    mapApiCategory(apiCategory) {
      if (!apiCategory || typeof apiCategory !== 'string') return 'Other';
      const c = apiCategory.toLowerCase();

      if (c.includes('fruit') || c.includes('apple') || c.includes('banana') || c.includes('orange') || c.includes('mango') || c.includes('berry') || c.includes('grape')) {
        return 'Fruits';
      }
      if (c.includes('veg') || c.includes('potato') || c.includes('tomato') || c.includes('onion') || c.includes('carrot') || c.includes('salad') || c.includes('green')) {
        return 'Vegetables';
      }
      if (c.includes('grain') || c.includes('rice') || c.includes('wheat') || c.includes('flour') || c.includes('cereal') || c.includes('bread') || c.includes('bakery') || c.includes('pasta')) {
        return 'Food Grains';
      }
      if (c.includes('dairy') || c.includes('milk') || c.includes('cheese') || c.includes('butter') || c.includes('yogurt') || c.includes('egg')) {
        return 'Dairy';
      }
      if (c.includes('clean') || c.includes('detergent') || c.includes('dishwash') || c.includes('wash') || c.includes('soap') || c.includes('sponge') || c.includes('wipe')) {
        return 'Cleaning';
      }
      if (c.includes('condiment') || c.includes('oil') || c.includes('spice') || c.includes('sauce') || c.includes('honey') || c.includes('salt') || c.includes('sugar') || c.includes('pepper') || c.includes('vinegar')) {
        return 'Condiments';
      }
      if (c.includes('skin') || c.includes('beauty') || c.includes('fragrance') || c.includes('cosmetic') || c.includes('cream') || c.includes('lotion') || c.includes('shampoo') || c.includes('perfume') || c.includes('lip')) {
        return 'Cosmetics';
      }
      if (c.includes('appliance') || c.includes('home') || c.includes('kitchen') || c.includes('electronic') || c.includes('furniture') || c.includes('toaster') || c.includes('kettle') || c.includes('lamp') || c.includes('clock')) {
        return 'Appliances';
      }
      if (c.includes('groceries')) {
        return 'Food Grains';
      }

      return 'Other';
    },

    // Gets a sensible default quantity string based on mapped category
    getDefaultQuantityForCategory(category) {
      switch (category) {
        case 'Fruits': return '1 kg';
        case 'Vegetables': return '1 kg';
        case 'Food Grains': return '2 kg';
        case 'Dairy': return '1 Litre';
        case 'Cleaning': return '1 bottle';
        case 'Condiments': return '1 jar';
        case 'Cosmetics': return '1 unit';
        case 'Appliances': return '1 unit';
        case 'Medicine': return '1 box';
        default: return '1 unit';
      }
    },

    // Searches products using DummyJSON API with seamless fallback to CatalogStore
    async searchProducts(query, category = 'All') {
      const resultsContainer = document.getElementById('apiResultsList');
      const loader = document.getElementById('apiLoader');
      const manualPrompt = document.getElementById('apiManualPrompt');
      
      if (!resultsContainer) return;

      // SESSION STORAGE: count how many catalog/API searches happened in this tab session
      if (typeof SessionModule !== 'undefined') {
        SessionModule.trackSearch();
      }

      if (loader) loader.style.display = 'block';
      if (manualPrompt) manualPrompt.style.display = 'none';
      resultsContainer.innerHTML = '';

      let results = [];

      try {
        let searchUrl = `/api/products?q=${encodeURIComponent(query ? query.trim() : '')}`;
        if (category && category !== 'All') {
          searchUrl += `&category=${encodeURIComponent(category)}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

        const response = await fetch(searchUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('API status not OK');
        
        const data = await response.json();
        
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          results = data.products.map(p => {
            const mappedCatName = this.mapApiCategory(p.category);
            const catObj = CatalogStore.getCategoryById(mappedCatName);
            return {
              id: p.id,
              name: p.name,
              brand: p.brand || 'Generic',
              categoryId: catObj ? catObj.id : (p.category ? p.category.toLowerCase().replace(/[^a-z0-9]/g, '') : 'other'),
              categoryName: mappedCatName,
              defaultQuantity: p.priceUnit || this.getDefaultQuantityForCategory(mappedCatName),
              suggestedShelfLifeDays: 30,
              description: p.description || '',
              image: p.image || '',
              tags: [],
              source: p.source === 'api' ? 'API' : 'Catalog'
            };
          });
        }
      } catch (err) {
        console.warn('SafeShelf server products API unavailable. Using local fallback catalog.', err.message);
      }

      // Dataset-first merge: local products remain available even when the API works.
      // Normalize names and compare brand where possible to prevent cross-source duplicates.
      const localResults = CatalogStore.searchProducts(query, category).map(p => ({ ...p, source: 'Catalog' }));
      const keyFor = p => String(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const localKeys = new Set(localResults.map(keyFor));
      const uniqueApiResults = results.filter(p => !localKeys.has(keyFor(p)));
      results = [...localResults, ...uniqueApiResults];

      if (loader) loader.style.display = 'none';

      // Render results
      if (results.length === 0) {
        resultsContainer.innerHTML = `
          <li style="padding: 16px; font-size: 13px; color: var(--text-muted); text-align: center;">
            No matching products found.
          </li>
        `;
        if (manualPrompt) manualPrompt.style.display = 'block';
        return;
      }

      this.renderProductCards(results);
    },

    // Renders suggestion cards in the Smart Product Picker
    renderProductCards(items) {
      const resultsContainer = document.getElementById('apiResultsList');
      const manualPrompt = document.getElementById('apiManualPrompt');
      if (!resultsContainer) return;

      resultsContainer.innerHTML = '';
      if (manualPrompt) manualPrompt.style.display = 'block';

      items.slice(0, 8).forEach(item => {
        const li = document.createElement('li');
        li.className = 'picker-result-card';
        li.style.cursor = 'pointer';

        const sourceClass = item.source === 'API' ? 'source-api' : 'source-catalog';
        const sourceLabel = item.source === 'API' ? 'Public API' : 'SafeShelf Catalog';
        const safeImage = item.image ? String(item.image).replace(/"/g, '&quot;') : '';
        const iconOrThumb = safeImage
          ? `<img src="${safeImage}" alt="${String(item.name || 'Product').replace(/"/g, '&quot;')}" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.parentElement.textContent='📦';">`
          : '📦';

        li.innerHTML = `
          <div class="picker-card-left">
            <div class="picker-thumb">${iconOrThumb}</div>
            <div class="picker-info">
              <div class="picker-title">${item.name}</div>
              <div class="picker-meta">
                <span class="badge badge-safe" style="font-size: 10px; padding: 2px 6px;">${item.categoryName}</span>
                <span class="picker-source-tag ${sourceClass}">${sourceLabel}</span>
              </div>
            </div>
          </div>
          <button type="button" class="picker-fill-btn">+ Fill Form</button>
        `;

        // Click on the card itself (excluding the button) opens preview
        li.addEventListener('click', (e) => {
          if (e.target.closest('.picker-fill-btn')) return;
          this.showCatalogProductPreview(item, item.source);
        });

        // Click on + Fill Form opens preview
        li.querySelector('.picker-fill-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          this.showCatalogProductPreview(item, item.source);
        });

        resultsContainer.appendChild(li);
      });
    },

    // Show catalog product preview modal
    showCatalogProductPreview(product, source) {
      const modalBody = document.getElementById('detailsModalBody');
      if (!modalBody) return;

      const sourceLabel = source === 'API' ? 'Public API' : 'SafeShelf Catalog';
      const badgeStyle = source === 'API'
        ? 'background-color: #E0E7FF; color: #4338CA; border: 1px solid #C7D2FE;'
        : 'background-color: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0;';

      const brand = product.brand || 'Generic';
      const defaultQty = product.defaultQuantity || '1 unit';
      const suggestedDays = product.suggestedShelfLifeDays || 30;
      const shelfLifeText = `~${suggestedDays}d suggested`;

      modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 48px; margin-bottom: 8px;">📦</div>
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 6px; color: var(--text-dark);">${product.name}</h2>
          <div style="display: flex; justify-content: center; gap: 8px; align-items: center; margin-top: 8px;">
            <span class="badge" style="font-size: 11px; padding: 4px 10px; border-radius: 9999px; ${badgeStyle}">${sourceLabel}</span>
            <span class="badge badge-safe" style="font-size: 11px; padding: 4px 10px; border-radius: 9999px;">${product.categoryName}</span>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="font-weight: 600; padding: 10px 8px; width: 40%; color: var(--text-dark);">Brand / Manufacturer:</td>
            <td style="padding: 10px 8px; color: var(--text-dark);">${brand}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="font-weight: 600; padding: 10px 8px; color: var(--text-dark);">Quantity Suggestion:</td>
            <td style="padding: 10px 8px; color: var(--text-dark);">${defaultQty}</td>
          </tr>
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="font-weight: 600; padding: 10px 8px; color: var(--text-dark);">Shelf Life / Suggestion:</td>
            <td style="padding: 10px 8px; color: var(--text-dark);">${shelfLifeText}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; padding: 10px 8px; vertical-align: top; color: var(--text-dark);">Description:</td>
            <td style="padding: 10px 8px; color: var(--text-muted); line-height: 1.4;">${product.description || 'No description available.'}</td>
          </tr>
        </table>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button type="button" class="btn btn-primary" id="previewAddBtn" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            📥 Add to Inventory
          </button>
          <button type="button" class="btn btn-outline" id="previewShopBtn" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            🛒 Add to Shopping List
          </button>
        </div>
      `;

      // Event listener for Add to Inventory button inside the preview
      document.getElementById('previewAddBtn').addEventListener('click', () => {
        document.getElementById('detailsModal').classList.remove('show');
        
        NavigationModule.navigateToView('inventory', { addMode: true });

        const nameInput = document.getElementById('productName');
        const catSelect = document.getElementById('productCategory');
        const qtyInput = document.getElementById('productQuantity');
        const descInput = document.getElementById('productDesc');
        const expiryInput = document.getElementById('productExpiry');
        const suggestionMsg = document.getElementById('expirySuggestionMsg');

        if (nameInput) nameInput.value = product.name;
        if (catSelect) {
          catSelect.value = product.categoryName;
          if (!catSelect.value) catSelect.value = 'Other';
        }
        if (qtyInput) qtyInput.value = defaultQty;
        if (descInput) {
          const brandInfo = brand !== 'Generic' && brand ? `Brand: ${brand}. ` : '';
          descInput.value = `${brandInfo}${product.description || ''}`.trim();
        }

        // Suggest expiry date based on suggestedShelfLifeDays
        if (expiryInput) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + suggestedDays);
          expiryInput.value = futureDate.toISOString().split('T')[0];
        }

        if (suggestionMsg) suggestionMsg.style.display = 'block';

        document.querySelectorAll('#productForm .form-input').forEach(input => {
          input.classList.remove('is-invalid');
        });

        const formEl = document.getElementById('productForm');
        if (formEl) {
          formEl.dataset.catalogProductId = product.id;
        }

        ['productName', 'productCategory', 'productQuantity', 'productExpiry', 'productDesc'].forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.style.backgroundColor = 'var(--primary-light)';
            setTimeout(() => { el.style.backgroundColor = ''; }, 900);
          }
        });
      });

      // Event listener for Add to Shopping List button inside the preview
      document.getElementById('previewShopBtn').addEventListener('click', () => {
        if (typeof ShoppingListModule !== 'undefined') {
          ShoppingListModule.addItem({
            name: product.name,
            category: product.categoryName,
            quantity: defaultQty,
            source: 'manual',
            reason: 'manual'
          });
          
          const shopBtn = document.getElementById('previewShopBtn');
          if (shopBtn) {
            shopBtn.textContent = '✓ Added to List';
            shopBtn.style.color = 'var(--primary)';
            shopBtn.style.borderColor = 'var(--primary)';
            setTimeout(() => {
              shopBtn.innerHTML = '🛒 Add to Shopping List';
              shopBtn.style.color = '';
              shopBtn.style.borderColor = '';
            }, 1500);
          }
        }
      });

      document.getElementById('detailsModal').classList.add('show');
    },

    // Initialize Smart Product Picker events and default view
    init() {
      const apiSearchInput = document.getElementById('apiSearchInput');
      const apiSearchBtn = document.getElementById('apiSearchBtn');
      const chipButtons = document.querySelectorAll('#pickerChips .picker-chip');
      const manualBtn = document.getElementById('pickerAddManualBtn');

      if (apiSearchBtn && apiSearchInput) {
        apiSearchBtn.addEventListener('click', () => {
          this.searchProducts(apiSearchInput.value, this.selectedCategory);
        });

        apiSearchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.searchProducts(apiSearchInput.value, this.selectedCategory);
          }
        });
      }

      // Category chip filters
      chipButtons.forEach(chip => {
        chip.addEventListener('click', () => {
          chipButtons.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.selectedCategory = chip.dataset.category || 'All';
          const query = apiSearchInput ? apiSearchInput.value : '';
          this.searchProducts(query, this.selectedCategory);
        });
      });

      // Manual Add Fallback button
      if (manualBtn) {
        manualBtn.addEventListener('click', () => {
          const nameInput = document.getElementById('productName');
          if (nameInput) {
            if (apiSearchInput && apiSearchInput.value.trim()) {
              nameInput.value = apiSearchInput.value.trim();
            }
            nameInput.focus();
          }
          const formSection = document.getElementById('inventoryFormSection');
          if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
        });
      }

      // Load initial suggestions
      this.searchProducts('', 'All');
    }
  };


  const ShoppingListModule = {
    LOW_STOCK_THRESHOLD: 1,
    SUPPRESSED_KEY: 'safeshelf_shopping_suppressed',
    currentFilter: 'all', // 'all' | 'pending' | 'purchased'

    init() {
      this.bindEvents();
      this.syncShoppingList(products);
    },

    getShoppingList() {
      return StorageModule.loadShoppingList(AuthModule.currentUser ? AuthModule.currentUser.id : null);
    },

    saveShoppingList(items) {
      StorageModule.saveShoppingList(AuthModule.currentUser ? AuthModule.currentUser.id : null, items);
    },

    getSuppressedProductIds() {
      if (!AuthModule.currentUser) return [];
      try {
        const all = JSON.parse(localStorage.getItem(this.SUPPRESSED_KEY) || '{}');
        return Array.isArray(all[AuthModule.currentUser.id]) ? all[AuthModule.currentUser.id] : [];
      } catch (e) { return []; }
    },

    saveSuppressedProductIds(ids) {
      if (!AuthModule.currentUser) return;
      try {
        const all = JSON.parse(localStorage.getItem(this.SUPPRESSED_KEY) || '{}');
        all[AuthModule.currentUser.id] = [...new Set(ids)];
        localStorage.setItem(this.SUPPRESSED_KEY, JSON.stringify(all));
      } catch (e) { console.warn('Could not save shopping suppression state', e); }
    },

    // Builds one auto-generated shopping list entry for a low/out-of-stock product.
    buildAutoItem(product, reason) {
      return {
        id: product.id,
        productId: product.id,
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        source: 'auto',
        reason: reason,
        purchased: false,
        addedAt: new Date().toISOString()
      };
    },

    // Goes through the inventory and works out which auto items should
    // exist (added, updated, or removed) based on current stock levels.
    // Manual items are never touched here - only auto-generated ones.
    updateAutoItemsFromInventory(productsList, autoItems, manualItems, suppressedIds = []) {
      const suppressed = new Set(suppressedIds);
      for (let i = 0; i < productsList.length; i++) {
        const product = productsList[i];
        const isOut = StorageModule.isOutOfStock(product.quantity);
        const isLow = StorageModule.isLowStock(product.quantity, this.LOW_STOCK_THRESHOLD);

        const existingAutoIndex = autoItems.findIndex(item => item.productId === product.id);
        const alreadyOnManualList = manualItems.some(item => item.productId === product.id);

        if (!isOut && !isLow) {
          suppressed.delete(product.id);
          if (existingAutoIndex !== -1) autoItems.splice(existingAutoIndex, 1);
          continue;
        }

        if (isOut || isLow) {
          if (suppressed.has(product.id)) {
            if (existingAutoIndex !== -1) autoItems.splice(existingAutoIndex, 1);
            continue;
          }
          const reason = isOut ? 'out_of_stock' : 'low_stock';

          if (existingAutoIndex !== -1) {
            // Already on the auto list: just refresh its details and reason,
            // keeping its purchased state as it was.
            autoItems[existingAutoIndex].name = product.name;
            autoItems[existingAutoIndex].category = product.category;
            autoItems[existingAutoIndex].quantity = product.quantity;
            autoItems[existingAutoIndex].reason = reason;
          } else if (!alreadyOnManualList) {
            // Not on either list yet, so add a new auto entry.
            autoItems.push(this.buildAutoItem(product, reason));
          }
        } else if (existingAutoIndex !== -1) {
          // Stock is fine again: remove the old auto entry.
          autoItems.splice(existingAutoIndex, 1);
        }
      }

      this.saveSuppressedProductIds([...suppressed]);
      return autoItems;
    },

    // Combines manual items and auto items into one list, making sure the
    // same product never appears twice (manual entries win if there's a clash).
    mergeShoppingItems(manualItems, autoItems) {
      const merged = [];
      const seenProductIds = new Set();

      manualItems.forEach(item => {
        if (item.productId) seenProductIds.add(item.productId);
        merged.push(item);
      });

      autoItems.forEach(item => {
        if (!seenProductIds.has(item.productId)) {
          seenProductIds.add(item.productId);
          merged.push(item);
        }
      });

      return merged;
    },

    // Synchronizes inventory items into the user's shopping list
    syncShoppingList(productsList) {
      if (!AuthModule.currentUser) return;
      const currentItems = this.getShoppingList();

      // Separate existing manual and auto items
      const manualItems = currentItems.filter(item => item.source === 'manual');
      let autoItems = currentItems.filter(item => item.source === 'auto');

      // Set of product IDs currently in user's inventory
      const inventoryProductIds = new Set(productsList.map(p => p.id));

      // Remove auto-generated items whose inventory products were deleted
      autoItems = autoItems.filter(item => inventoryProductIds.has(item.productId));

      // Add/update/remove auto items based on stock. Suppressed products remain
      // hidden until their stock rises above the low-stock threshold.
      autoItems = this.updateAutoItemsFromInventory(productsList, autoItems, manualItems, this.getSuppressedProductIds());

      // Merge manual and auto items with strict duplicate prevention
      const merged = this.mergeShoppingItems(manualItems, autoItems);

      this.saveShoppingList(merged);
      this.renderShoppingList();
    },

    // Manually adds a product or custom item to shopping list
    addItem(itemData) {
      if (!AuthModule.currentUser) return { success: false, message: 'Not logged in' };
      const list = this.getShoppingList();
      const existingIndex = list.findIndex(item => 
        (itemData.productId && item.productId === itemData.productId) || 
        item.name.toLowerCase().trim() === itemData.name.toLowerCase().trim()
      );

      let isDuplicate = false;
      if (existingIndex !== -1) {
        isDuplicate = true;
        list[existingIndex].source = 'manual';
        list[existingIndex].reason = 'manual';
        if (itemData.quantity) list[existingIndex].quantity = itemData.quantity;
        if (itemData.category) list[existingIndex].category = itemData.category;
        showNotification(`ℹ️ "${itemData.name}" is already in your shopping list.`, 'info');
      } else {
        list.unshift({
          id: itemData.id || 'shop_' + Date.now(),
          productId: itemData.productId || null,
          name: itemData.name.trim(),
          category: itemData.category || 'Other',
          quantity: itemData.quantity || '1 unit',
          source: 'manual',
          reason: 'manual',
          purchased: false,
          addedAt: new Date().toISOString()
        });
        showNotification(`✓ "${itemData.name}" added to shopping list.`, 'success');
      }

      this.saveShoppingList(list);
      this.renderShoppingList();
      return { success: true, isDuplicate: isDuplicate };
    },

    // Toggles the purchased state of a shopping list item
    togglePurchased(id) {
      const list = this.getShoppingList();
      const item = list.find(i => i.id === id);
      if (item) {
        item.purchased = !item.purchased;
        this.saveShoppingList(list);
        this.renderShoppingList();
      }
    },

    // Removes an item from the shopping list
    removeItem(id) {
      let list = this.getShoppingList();
      const target = list.find(i => i.id === id);
      list = list.filter(i => i.id !== id);
      this.saveShoppingList(list);
      this.renderShoppingList();
      if (target) {
        showNotification(`Removed "${target.name}" from shopping list.`, 'info');
      }
    },

    // Clears all completed (purchased) items
    clearPurchased() {
      let list = this.getShoppingList();
      const purchasedCount = list.filter(i => i.purchased).length;
      if (purchasedCount === 0) {
        showNotification('No completed items to clear.', 'info');
        return;
      }
      const clearedAutoProductIds = list.filter(i => i.purchased && i.source === 'auto' && i.productId).map(i => i.productId);
      this.saveSuppressedProductIds([...this.getSuppressedProductIds(), ...clearedAutoProductIds]);
      list = list.filter(i => !i.purchased);
      this.saveShoppingList(list);
      this.renderShoppingList();
      showNotification(`Cleared ${purchasedCount} purchased item(s).`, 'success');
    },

    currentCategoryFilter: 'All Categories',

    // Sets the active filter tab (All, To Buy, Purchased)
    setFilter(filter) {
      this.currentFilter = filter;
      document.querySelectorAll('#shoppingFilterTabs .tab-btn').forEach(btn => {
        if (btn.dataset.filter === filter) btn.classList.add('active');
        else btn.classList.remove('active');
      });
      this.renderShoppingList();
    },

    // Renders the Shopping List UI (applies both status and category filters)
    renderShoppingList() {
      const list = this.getShoppingList();
      const tbody = document.getElementById('shoppingTableBody');
      const emptyState = document.getElementById('shoppingEmptyState');
      const tableWrapper = document.getElementById('shoppingTableWrapper');

      // Metric calculations
      const totalToBuy = list.filter(i => !i.purchased).length;
      const outOfStockCount = list.filter(i => i.reason === 'out_of_stock' && !i.purchased).length;
      const lowStockCount = list.filter(i => i.reason === 'low_stock' && !i.purchased).length;
      const purchasedCount = list.filter(i => i.purchased).length;

      const elTotal = document.getElementById('shoppingMetricTotal');
      const elOut = document.getElementById('shoppingMetricOutOfStock');
      const elLow = document.getElementById('shoppingMetricLowStock');
      const elPurchased = document.getElementById('shoppingMetricPurchased');

      if (elTotal) elTotal.textContent = totalToBuy;
      if (elOut) elOut.textContent = outOfStockCount;
      if (elLow) elLow.textContent = lowStockCount;
      if (elPurchased) elPurchased.textContent = purchasedCount;

      // Tab badges
      const tabAll = document.getElementById('tabCountAll');
      const tabPending = document.getElementById('tabCountPending');
      const tabDone = document.getElementById('tabCountPurchased');
      if (tabAll) tabAll.textContent = list.length;
      if (tabPending) tabPending.textContent = totalToBuy;
      if (tabDone) tabDone.textContent = purchasedCount;

      if (!tbody) return;

      // Apply status filter
      let filtered = list;
      if (this.currentFilter === 'pending') {
        filtered = filtered.filter(i => !i.purchased);
      } else if (this.currentFilter === 'purchased') {
        filtered = filtered.filter(i => i.purchased);
      }

      // Apply category filter
      if (this.currentCategoryFilter && this.currentCategoryFilter !== 'All Categories') {
        filtered = filtered.filter(i => i.category === this.currentCategoryFilter);
      }

      if (list.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableWrapper) tableWrapper.style.display = 'none';
        tbody.innerHTML = '';
        return;
      } else {
        if (emptyState) emptyState.style.display = 'none';
        if (tableWrapper) tableWrapper.style.display = 'block';
      }

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No items matching this category/filter.</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = `shopping-item-row ${item.purchased ? 'purchased' : ''}`;

        let reasonBadge = '';
        if (item.purchased) {
          reasonBadge = '<span class="badge badge-purchased">✓ Purchased</span>';
        } else if (item.reason === 'out_of_stock') {
          reasonBadge = '<span class="badge badge-out-of-stock">Out of Stock</span>';
        } else if (item.reason === 'low_stock') {
          reasonBadge = '<span class="badge badge-low-stock">Low Stock</span>';
        } else {
          reasonBadge = '<span class="badge badge-manual">Need to Buy</span>';
        }

        tr.innerHTML = `
          <td style="text-align: center;">
            <input type="checkbox" class="shopping-checkbox" data-id="${item.id}" ${item.purchased ? 'checked' : ''} aria-label="Mark as purchased">
          </td>
          <td>
            <div class="product-cell">
              <div class="product-thumbnail-box" style="width: 28px; height: 28px; min-width: 28px; font-size: 10px;">
                ${(function() {
                  let img = null;
                  if (typeof InventoryModule !== 'undefined' && InventoryModule.getProductImage) {
                    img = InventoryModule.getProductImage(item);
                  }
                  if (img) return `<img src="${img}" alt="${item.name}" class="product-thumbnail-img" onerror="this.style.display='none';">`;
                  return item.name ? item.name.slice(0, 2).toUpperCase() : 'SS';
                })()}
              </div>
              <div>
                <span class="product-name shopping-item-name">${item.name}</span>
                <span class="product-meta">${item.source === 'auto' ? 'Auto-synced from inventory' : 'Added manually'}</span>
              </div>
            </div>
          </td>
          <td><span class="badge badge-safe" style="font-size: 11px;">${item.category}</span></td>
          <td><strong>${item.quantity || '1 unit'}</strong></td>
          <td>${reasonBadge}</td>
          <td style="text-align: right;">
            <button class="table-btn table-btn-danger remove-shopping-item" data-id="${item.id}" title="Remove from list">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Attach item row event listeners
      tbody.querySelectorAll('.shopping-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          this.togglePurchased(e.target.dataset.id);
        });
      });

      tbody.querySelectorAll('.remove-shopping-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.removeItem(e.target.dataset.id);
        });
      });
    },

    // Generates a clean print-friendly view and triggers browser print / save as PDF
    exportShoppingListPDF() {
      const list = this.getShoppingList();
      if (list.length === 0) {
        showNotification('Your shopping list is empty. Add products or low-stock items before printing.', 'warning');
        return;
      }

      const printContainer = document.getElementById('printableShoppingList');
      if (!printContainer) return;

      const todayFormatted = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let tableRows = '';
      list.forEach(item => {
        let reasonText = item.reason === 'out_of_stock' ? 'Out of Stock' : (item.reason === 'low_stock' ? 'Low Stock' : 'Need to Buy');
        if (item.purchased) reasonText += ' (Purchased)';

        tableRows += `
          <tr>
            <td style="width: 32px; text-align: center;">
              <span class="print-checkbox">${item.purchased ? '✓' : ''}</span>
            </td>
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td>${item.quantity || '1 unit'}</td>
            <td><span class="print-badge">${reasonText}</span></td>
          </tr>
        `;
      });

      printContainer.innerHTML = `
        <div class="print-header">
          <div>
            <div class="print-logo">SafeShelf</div>
            <div class="print-title">Household Shopping List</div>
          </div>
          <div class="print-date">Generated on: ${todayFormatted}</div>
        </div>

        <table class="print-table">
          <thead>
            <tr>
              <th style="width: 32px;">Status</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="print-footer">
          SafeShelf — Smart Household Inventory & Shopping Assistant
        </div>
      `;

      // Trigger browser native print dialog (which offers "Save as PDF")
      window.print();
    },

    bindEvents() {
      // Filter tabs listeners
      document.querySelectorAll('#shoppingFilterTabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.setFilter(e.target.dataset.filter);
        });
      });

      // Category filter listener for shopping list
      const shoppingCatFilter = document.getElementById('shoppingCategoryFilter');
      if (shoppingCatFilter) {
        shoppingCatFilter.addEventListener('change', (e) => {
          this.currentCategoryFilter = e.target.value;
          this.renderShoppingList();
        });
      }

      // Quick add custom item form
      const quickForm = document.getElementById('quickAddShoppingForm');
      if (quickForm) {
        quickForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const nameInput = document.getElementById('quickShoppingInput');
          const catSelect = document.getElementById('quickShoppingCategory');
          const name = nameInput ? nameInput.value.trim() : '';
          if (!name) return;

          this.addItem({
            name: name,
            category: catSelect ? catSelect.value : 'Other',
            quantity: '1 unit',
            source: 'manual',
            reason: 'manual'
          });

          nameInput.value = '';
        });
      }

      // Clear completed button
      const clearBtn = document.getElementById('clearPurchasedBtn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearPurchased();
        });
      }

      // Print / Save as PDF button
      const printBtn = document.getElementById('printShoppingListBtn');
      if (printBtn) {
        printBtn.addEventListener('click', () => {
          this.exportShoppingListPDF();
        });
      }

      // Email low-stock list button
      const emailBtn = document.getElementById('emailLowStockBtn');
      if (emailBtn) {
        emailBtn.addEventListener('click', () => {
          if (typeof EmailModule !== 'undefined') {
            EmailModule.sendLowStockEmail();
          }
        });
      }
    }
  };

  // ==========================================
  // EMAIL NOTIFICATION MODULE (EmailJS API)
  // ------------------------------------------------------------
  // Sends low-stock household inventory alerts directly from the
  // client using EmailJS SDK. No Node.js backend required.
  // ------------------------------------------------------------
  const EmailModule = {
    // Builds the list of low-stock / out-of-stock items to email
    getLowStockItemsForEmail() {
      return products
        .filter(p => StorageModule.isOutOfStock(p.quantity) || StorageModule.isLowStock(p.quantity, ShoppingListModule.LOW_STOCK_THRESHOLD))
        .map(p => ({
          name: p.name,
          category: p.category,
          quantity: p.quantity,
          status: StorageModule.isOutOfStock(p.quantity) ? 'Out of Stock' : 'Low Stock'
        }));
    },

    async sendLowStockEmail() {
      const btn = document.getElementById('emailLowStockBtn');
      if (!AuthModule.currentUser) {
        showNotification('⚠️ Please log in to send low-stock email notifications.', 'warning');
        return;
      }

      const recipientEmail = AuthModule.currentUser.email ? AuthModule.currentUser.email.trim() : '';
      if (!recipientEmail || !isValidEmail(recipientEmail)) {
        showNotification('⚠️ Please update your profile with a valid email address first.', 'warning');
        return;
      }

      // 1. Check for placeholder or missing EmailJS configuration
      if (
        typeof EMAIL_CONFIG === 'undefined' ||
        !EMAIL_CONFIG.SERVICE_ID ||
        !EMAIL_CONFIG.TEMPLATE_ID ||
        !EMAIL_CONFIG.PUBLIC_KEY ||
        EMAIL_CONFIG.SERVICE_ID.includes('YOUR_') ||
        EMAIL_CONFIG.TEMPLATE_ID.includes('YOUR_') ||
        EMAIL_CONFIG.PUBLIC_KEY.includes('YOUR_')
      ) {
        showNotification('⚠️ EmailJS is not configured yet. Please add your Service ID, Template ID, and Public Key in js/config.js.', 'warning');
        console.warn('SafeShelf EmailJS Setup Required: Update EMAIL_CONFIG in js/config.js with your EmailJS credentials.');
        return;
      }

      // 2. Check for low stock items
      const items = this.getLowStockItemsForEmail();
      if (items.length === 0) {
        showNotification('✓ Nothing is low or out of stock right now — no email needed.', 'info');
        return;
      }

      // 3. Format low-stock items text block
      const formattedItems = items.map((item, index) => 
        `${index + 1}. ${item.name}\n   Category: ${item.category}\n   Current Quantity: ${item.quantity}\n   Status: ${item.status}`
      ).join('\n\n');

      const templateParams = {
        to_name: AuthModule.currentUser.name || 'SafeShelf User',
        to_email: recipientEmail,
        item_count: items.length,
        low_stock_items: formattedItems,
        app_name: 'SafeShelf'
      };

      const originalText = btn ? btn.innerHTML : '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> Sending Email...';
      }

      try {
        // Initialize EmailJS with Public Key if SDK is loaded
        if (typeof emailjs !== 'undefined' && emailjs.init) {
          emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
        }

        const result = await emailjs.send(
          EMAIL_CONFIG.SERVICE_ID,
          EMAIL_CONFIG.TEMPLATE_ID,
          templateParams
        );

        console.log('EmailJS response:', result);
        showNotification(`✓ Low-stock notification emailed to ${recipientEmail}.`, 'success');
      } catch (err) {
        console.error('EmailJS error:', err);
        const errorText = err && (err.text || err.message) ? (err.text || err.message) : 'Check EmailJS credentials.';
        showNotification(`⚠️ Failed to send email: ${errorText}`, 'warning');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      }
    }
  };
