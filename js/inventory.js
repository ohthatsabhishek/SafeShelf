/**
 * SAFESHELF — inventory.js
 * ------------------------------------------------------------
 * MEMBER 2 MODULE: Product Catalog & Inventory Management
 * ------------------------------------------------------------
 * Contains:
 *   - CatalogStore    -> built-in product/category dataset (Topics 15-16: Objects, JSON)
 *   - InventoryModule -> CRUD table, search/filter/sort, form handling,
 *                         the product details modal (Topics 9-14, 17-22)
 *
 * Depends on: js/auth.js (shared state, AuthModule, StorageModule)
 * Loaded after auth.js, before features.js and dashboard.js.
 * ------------------------------------------------------------
 */

  const CatalogStore = {
    categories: [
      {
        id: "fruits",
        name: "Fruits",
        icon: "🍎",
        color: "#E11D48",
        description: "Fresh fruits for everyday use.",
        sortOrder: 1,
        products: [
          {
            id: "apple",
            name: "Apple",
            brand: "NatureFresh",
            categoryId: "fruits",
            defaultQuantity: "1 kg",
            suggestedShelfLifeDays: 7,
            description: "Crisp and juicy sweet red eating apples.",
            image: "./images/apple.jpeg",
            tags: ["fresh", "fruit"]
          },
          {
            id: "banana",
            name: "Banana",
            brand: "FarmFresh",
            categoryId: "fruits",
            defaultQuantity: "1 bunch",
            suggestedShelfLifeDays: 5,
            description: "Naturally ripened sweet yellow bananas.",
            image: "./images/banana.jpeg",
            tags: ["fresh", "fruit"]
          },
          {
            id: "orange",
            name: "Orange",
            brand: "SunCitrus",
            categoryId: "fruits",
            defaultQuantity: "1 kg",
            suggestedShelfLifeDays: 10,
            description: "Juicy vitamin-C rich sweet table oranges.",
            image: "./images/orange.jpeg",
            tags: ["fresh", "fruit"]
          },
          {
            id: "mango",
            name: "Mango",
            brand: "TropicalHarvest",
            categoryId: "fruits",
            defaultQuantity: "1 kg",
            suggestedShelfLifeDays: 6,
            description: "Aromatic sweet fresh alphonso mangoes.",
            image: "./images/mango.jpeg",
            tags: ["fresh", "fruit"]
          }
        ]
      },
      {
        id: "vegetables",
        name: "Vegetables",
        icon: "🥦",
        color: "#16A34A",
        description: "Fresh farm vegetables.",
        sortOrder: 2,
        products: [
          {
            id: "potato",
            name: "Potato",
            brand: "PureEarth",
            categoryId: "vegetables",
            defaultQuantity: "2 kg",
            suggestedShelfLifeDays: 21,
            description: "All-purpose fresh brown cooking potatoes.",
            image: "./images/potato.jpeg",
            tags: ["fresh", "vegetable"]
          },
          {
            id: "tomato",
            name: "Tomato",
            brand: "GreenField",
            categoryId: "vegetables",
            defaultQuantity: "1 kg",
            suggestedShelfLifeDays: 7,
            description: "Plump juicy farm-fresh red cooking tomatoes.",
            image: "./images/tomato.jpeg",
            tags: ["fresh", "vegetable"]
          },
          {
            id: "onion",
            name: "Onion",
            brand: "FarmFresh",
            categoryId: "vegetables",
            defaultQuantity: "1 kg",
            suggestedShelfLifeDays: 30,
            description: "Crisp pungent red onions for daily cooking.",
            image: "./images/onions.jpeg",
            tags: ["fresh", "vegetable"]
          },
          {
            id: "carrot",
            name: "Carrot",
            brand: "GreenField",
            categoryId: "vegetables",
            defaultQuantity: "500 g",
            suggestedShelfLifeDays: 14,
            description: "Sweet crunchy fresh orange garden carrots.",
            image: "./images/carrot.jpeg",
            tags: ["fresh", "vegetable"]
          }
        ]
      },
      {
        id: "dairy",
        name: "Dairy",
        icon: "🥛",
        color: "#0284C7",
        description: "Milk and dairy products.",
        sortOrder: 3,
        products: [
          {
            id: "milk",
            name: "Milk",
            brand: "FarmFresh",
            categoryId: "dairy",
            defaultQuantity: "1 Litre",
            suggestedShelfLifeDays: 5,
            description: "Pasteurized homogenized full-cream dairy milk.",
            image: "./images/milk.jpeg",
            tags: ["dairy", "fresh"]
          },
          {
            id: "butter",
            name: "Butter",
            brand: "CountryChurn",
            categoryId: "dairy",
            defaultQuantity: "500 g",
            suggestedShelfLifeDays: 60,
            description: "Fresh churned unsalted creamery butter block.",
            image: "./images/butter.jpeg",
            tags: ["dairy"]
          },
          {
            id: "cheese",
            name: "Cheese",
            brand: "DairyGold",
            categoryId: "dairy",
            defaultQuantity: "250 g",
            suggestedShelfLifeDays: 30,
            description: "Naturally aged mild cheddar cheese block.",
            image: "./images/cheese.jpeg",
            tags: ["dairy"]
          },
          {
            id: "greek_yogurt",
            name: "Greek Yogurt",
            brand: "PureDairy",
            categoryId: "dairy",
            defaultQuantity: "400 g",
            suggestedShelfLifeDays: 14,
            description: "Thick creamy plain probiotic yogurt.",
            image: "./images/greek_yogurt.jpeg",
            tags: ["dairy", "yogurt"]
          }
        ]
      },
      {
        id: "cleaning",
        name: "Cleaning",
        icon: "🧹",
        color: "#D97706",
        description: "Household cleaning items.",
        sortOrder: 4,
        products: [
          {
            id: "dishwash",
            name: "Dishwash",
            brand: "SparkleClean",
            categoryId: "cleaning",
            defaultQuantity: "1 bottle",
            suggestedShelfLifeDays: 180,
            description: "Concentrated grease-cutting dishwashing liquid.",
            image: "./images/dishwash.jpeg",
            tags: ["cleaning", "household"]
          },
          {
            id: "detergent",
            name: "Detergent",
            brand: "PureWash",
            categoryId: "cleaning",
            defaultQuantity: "2 kg",
            suggestedShelfLifeDays: 365,
            description: "Phosphate-free fabric washing powder.",
            image: "./images/detergent.jpeg",
            tags: ["cleaning", "household"]
          },
          {
            id: "floor_cleaner",
            name: "Floor Cleaner",
            brand: "CleanHome",
            categoryId: "cleaning",
            defaultQuantity: "1 Litre",
            suggestedShelfLifeDays: 365,
            description: "Disinfectant surface and floor cleaner.",
            image: "./images/floorcleaner.jpeg",
            tags: ["cleaning", "household"]
          },
          {
            id: "antibacterial_spray",
            name: "Antibacterial Spray",
            brand: "ShieldPro",
            categoryId: "cleaning",
            defaultQuantity: "500 ml",
            suggestedShelfLifeDays: 365,
            description: "Kitchen and bathroom disinfectant spray.",
            image: "./images/sanitizer.jpeg",
            tags: ["cleaning", "household"]
          }
        ]
      },
      {
        id: "foodGrains",
        name: "Food Grains",
        icon: "🌾",
        color: "#84CC16",
        description: "Grains, flours, and cereals.",
        sortOrder: 5,
        products: [
          {
            id: "basmati_rice",
            name: "Basmati Rice",
            brand: "Royal Farm",
            categoryId: "foodGrains",
            defaultQuantity: "2 kg",
            suggestedShelfLifeDays: 180,
            description: "Aromatic premium long-grain basmati rice.",
            image: "./images/rice.jpeg",
            tags: ["grain", "rice"]
          },
          {
            id: "wheat_flour",
            name: "Wheat Flour",
            brand: "Nature Harvest",
            categoryId: "foodGrains",
            defaultQuantity: "5 kg",
            suggestedShelfLifeDays: 90,
            description: "100% stone ground whole wheat flour.",
            image: "./images/wheat_flour.jpeg",
            tags: ["grain", "flour", "atta"]
          },
          {
            id: "rolled_oats",
            name: "Rolled Oats",
            brand: "OatFresh",
            categoryId: "foodGrains",
            defaultQuantity: "1 kg",
            suggestedShelfLifeDays: 180,
            description: "Whole grain breakfast rolled oats.",
            image: "./images/rolledoats.jpeg",
            tags: ["grain", "oats"]
          },
          {
            id: "quinoa",
            name: "Quinoa",
            brand: "SuperGrains",
            categoryId: "foodGrains",
            defaultQuantity: "500 g",
            suggestedShelfLifeDays: 180,
            description: "High protein white quinoa seeds.",
            image: "./images/quinoa.jpeg",
            tags: ["grain", "seed", "seeds"]
          }
        ]
      },
      {
        id: "condiments",
        name: "Condiments",
        icon: "🧂",
        color: "#EA580C",
        description: "Spices, oils, and sweeteners.",
        sortOrder: 6,
        products: [
          {
            id: "olive_oil",
            name: "Olive Oil",
            brand: "Mediterranean Choice",
            categoryId: "condiments",
            defaultQuantity: "500 ml",
            suggestedShelfLifeDays: 180,
            description: "Cold pressed extra virgin olive cooking oil.",
            image: "./images/oliveoil.jpeg",
            tags: ["oil", "condiment"]
          },
          {
            id: "honey",
            name: "Honey",
            brand: "BeePure",
            categoryId: "condiments",
            defaultQuantity: "500 g",
            suggestedShelfLifeDays: 365,
            description: "100% pure unfiltered organic forest honey.",
            image: "./images/honey.jpeg",
            tags: ["sweetener", "condiment"]
          },
          {
            id: "black_pepper",
            name: "Black Pepper",
            brand: "SpiceMaster",
            categoryId: "condiments",
            defaultQuantity: "100 g",
            suggestedShelfLifeDays: 365,
            description: "Aromatic whole black peppercorns in glass jar.",
            image: "./images/black_pepper.jpeg",
            tags: ["spice", "condiment"]
          },
          {
            id: "himalayan_pink_salt",
            name: "Himalayan Pink Salt",
            brand: "PureEarth",
            categoryId: "condiments",
            defaultQuantity: "1 kg",
            suggestedShelfLifeDays: 730,
            description: "Mineral-rich unrefined fine pink cooking salt.",
            image: "./images/pinksalt.jpeg",
            tags: ["salt", "condiment", "pink salt"]
          }
        ]
      },
      {
        id: "cosmetics",
        name: "Cosmetics",
        icon: "🧴",
        color: "#EC4899",
        description: "Skincare and personal care.",
        sortOrder: 7,
        products: [
          {
            id: "body_lotion",
            name: "Body Lotion",
            brand: "DermaGlow",
            categoryId: "cosmetics",
            defaultQuantity: "400 ml",
            suggestedShelfLifeDays: 180,
            description: "Hydrating aloe vera & shea butter body lotion.",
            image: "./images/bodylotion.jpeg",
            tags: ["cosmetic", "skincare"]
          },
          {
            id: "face_wash",
            name: "Face Wash",
            brand: "PureSkin",
            categoryId: "cosmetics",
            defaultQuantity: "150 ml",
            suggestedShelfLifeDays: 180,
            description: "Daily mild cleanser with tea tree & vitamin E.",
            image: "./images/himalyan_facewash.jpeg",
            tags: ["cosmetic", "skincare"]
          },
          {
            id: "sunscreen",
            name: "Sunscreen",
            brand: "SunSafe",
            categoryId: "cosmetics",
            defaultQuantity: "100 ml",
            suggestedShelfLifeDays: 365,
            description: "Non-greasy UV protective facial sunscreen.",
            image: "./images/sunscreen.jpeg",
            tags: ["cosmetic", "sunscreen", "spf 50"]
          }
        ]
      },
      {
        id: "appliances",
        name: "Appliances",
        icon: "🔌",
        color: "#6366F1",
        description: "Kitchen and home appliances.",
        sortOrder: 8,
        products: [
          {
            id: "electric_kettle",
            name: "Electric Kettle",
            brand: "HomeTech",
            categoryId: "appliances",
            defaultQuantity: "1 unit",
            suggestedShelfLifeDays: 730,
            description: "Fast boil automatic shut-off cordless kettle.",
            image: "./images/electric_kettle.jpeg",
            tags: ["appliance", "kitchen"]
          },
          {
            id: "compact_blender",
            name: "Compact Blender",
            brand: "PowerBlend",
            categoryId: "appliances",
            defaultQuantity: "1 unit",
            suggestedShelfLifeDays: 730,
            description: "Multi-speed smoothie maker and food processor.",
            image: "./images/blender.jpeg",
            tags: ["appliance", "kitchen"]
          },
          {
            id: "two_slice_toaster",
            name: "2-Slice Toaster",
            brand: "ToastPro",
            categoryId: "appliances",
            defaultQuantity: "1 unit",
            suggestedShelfLifeDays: 730,
            description: "Even browning with defrost and cancel functions.",
            image: "./images/twoslicebreadtoaster.jpeg",
            tags: ["appliance", "kitchen", "pop-up toaster"]
          }
        ]
      },
      {
        id: "medicine",
        name: "Medicine",
        icon: "💊",
        color: "#EF4444",
        description: "Over the counter health products.",
        sortOrder: 9,
        products: [
          {
            id: "paracetamol",
            name: "Paracetamol 500mg",
            brand: "Generic",
            categoryId: "medicine",
            defaultQuantity: "1 box",
            suggestedShelfLifeDays: 120,
            description: "Over-the-counter pain reliever and fever reducer.",
            image: "./images/paracetamol.png",
            tags: ["medicine", "health"]
          }
        ]
      },
      {
        id: "other",
        name: "Other",
        icon: "📦",
        color: "#6B7280",
        description: "Miscellaneous household items.",
        sortOrder: 10,
        products: [
          {
            id: "paper_towels",
            name: "Paper Towels",
            brand: "SoftHome",
            categoryId: "other",
            defaultQuantity: "1 pack",
            suggestedShelfLifeDays: 365,
            description: "Super absorbent 2-ply kitchen tissue paper.",
            image: "./images/papertowels.png",
            tags: ["household", "other"]
          }
        ]
      }
    ],

    _normalize(p, cat) {
      return {
        id: p.id,
        name: p.name,
        brand: p.brand || 'Generic',
        categoryId: cat.id,
        categoryName: cat.name,
        defaultQuantity: p.defaultQuantity || '1 unit',
        suggestedShelfLifeDays: p.suggestedShelfLifeDays || 30,
        description: p.description || '',
        image: p.image || '',
        tags: p.tags || [],
        source: 'Catalog'
      };
    },

    getCategories() {
      return this.categories.map(cat => ({
        ...cat,
        products: cat.products.map(p => this._normalize(p, cat))
      }));
    },

    getCategoryById(categoryId) {
      const cat = this.categories.find(c => c.id === categoryId || c.name.toLowerCase() === categoryId.toLowerCase());
      if (!cat) return null;
      return {
        ...cat,
        products: cat.products.map(p => this._normalize(p, cat))
      };
    },

    getAllProducts() {
      const all = [];
      this.categories.forEach(cat => {
        cat.products.forEach(p => {
          all.push(this._normalize(p, cat));
        });
      });
      return all;
    },

    getProductsByCategory(categoryId) {
      const cat = this.getCategoryById(categoryId);
      if (!cat) return [];
      return cat.products;
    },

    getProductById(productId) {
      for (const cat of this.categories) {
        const prod = cat.products.find(p => p.id === productId);
        if (prod) return this._normalize(prod, cat);
      }
      return null;
    },

    searchProducts(query, categoryId) {
      let list = [];
      if (categoryId && categoryId !== 'All' && categoryId !== 'All Categories') {
        list = this.getProductsByCategory(categoryId);
      } else {
        list = this.getAllProducts();
      }

      if (!query || query.trim() === '') return list;

      const q = query.toLowerCase().trim();
      return list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    },

    mapToInventoryDefaults(productId) {
      let product = (typeof productId === 'object') ? productId : this.getProductById(productId);
      if (!product) return null;
      return {
        name: product.name,
        category: product.categoryName || 'Other',
        quantity: product.defaultQuantity,
        description: product.brand && product.brand !== 'Generic' ? `Brand: ${product.brand}. ${product.description || ''}` : product.description || '',
        suggestedDays: product.suggestedShelfLifeDays || 30
      };
    }
  };


  const InventoryModule = {
    // Renders the list table based on filters, search, and sorting
    renderProductTable(productsList) {
      const tbody = document.getElementById('productTableBody');
      const recentBody = document.getElementById('recentTableBody');
      if (!tbody) return;

      tbody.innerHTML = '';

      // Get values from filters
      const searchQuery = document.getElementById('searchInput').value.toLowerCase();
      const categoryFilter = document.getElementById('categoryFilter').value;
      const statusFilter = document.getElementById('statusFilter').value;

      // Filter products
      let filtered = productsList.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery) || 
                              (item.description && item.description.toLowerCase().includes(searchQuery));
        const matchesCategory = !categoryFilter || categoryFilter === 'All Categories' || item.category === categoryFilter;
        
        const statusInfo = DashboardModule.getItemStatus(item.expiryDate);
        const matchesStatus = !statusFilter || statusFilter === 'All Statuses' || statusInfo.text === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
      });

      // Apply Sort
      filtered = DashboardModule.sortProducts(filtered, sortField, sortDirection);

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No products found matching filters.</td></tr>`;
      } else {
        filtered.forEach(item => {
          const statusInfo = DashboardModule.getItemStatus(item.expiryDate);
          const daysLeft = DashboardModule.getDaysRemaining(item.expiryDate);
          
          let expiryDisplay = item.expiryDate;
          if (daysLeft < 0) {
            expiryDisplay += ` (Expired)`;
          } else if (daysLeft === 0) {
            expiryDisplay += ` (Today)`;
          } else {
            expiryDisplay += ` (${daysLeft}d left)`;
          }

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>
              <div class="product-cell">
                <div class="product-img-placeholder">📦</div>
                <div>
                  <span class="product-name">${item.name}</span>
                  <span class="product-meta">${item.description || 'No description'}</span>
                </div>
              </div>
            </td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>${expiryDisplay}</td>
            <td><span class="badge ${statusInfo.class}">${statusInfo.text}</span></td>
            <td>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button class="btn btn-outline btn-sm action-view" data-id="${item.id}">View</button>
                <button class="btn btn-secondary btn-sm action-edit" data-id="${item.id}">Edit</button>
                <button class="btn btn-outline btn-sm action-shop" data-id="${item.id}" title="Add to Shopping List">🛒 Add to List</button>
                <button class="btn btn-danger btn-sm action-delete" data-id="${item.id}">Delete</button>
              </div>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }

      // Populate dashboard recent items (max 5)
      if (recentBody) {
        recentBody.innerHTML = '';
        const recentItems = productsList.slice(-5).reverse(); // Latest items added
        if (recentItems.length === 0) {
          recentBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">No products added yet.</td></tr>`;
        } else {
          recentItems.forEach(item => {
            const statusInfo = DashboardModule.getItemStatus(item.expiryDate);
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>
                <div class="product-cell">
                  <div class="product-img-placeholder">📦</div>
                  <span class="product-name">${item.name}</span>
                </div>
              </td>
              <td>${item.category}</td>
              <td>${item.quantity}</td>
              <td>${item.expiryDate}</td>
              <td><span class="badge ${statusInfo.class}">${statusInfo.text}</span></td>
              <td>
                <button class="btn btn-outline btn-sm action-view" data-id="${item.id}">View</button>
              </td>
            `;
            recentBody.appendChild(tr);
          });
        }
      }

      // Attach actions dynamic event listeners
      document.querySelectorAll('.action-view').forEach(btn => {
        btn.addEventListener('click', (e) => this.showProductDetails(e.currentTarget.dataset.id));
      });
      document.querySelectorAll('.action-edit').forEach(btn => {
        btn.addEventListener('click', (e) => this.setupEditMode(e.currentTarget.dataset.id));
      });
      document.querySelectorAll('.action-shop').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
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
            const originalText = e.currentTarget.innerHTML;
            e.currentTarget.innerHTML = '✓ Added';
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.borderColor = 'var(--primary)';
            setTimeout(() => {
              e.currentTarget.innerHTML = originalText;
              e.currentTarget.style.color = '';
              e.currentTarget.style.borderColor = '';
            }, 1200);
          }
        });
      });
      document.querySelectorAll('.action-delete').forEach(btn => {
        btn.addEventListener('click', (e) => this.deleteProduct(e.currentTarget.dataset.id));
      });
    },

    // Displays the modal details view
    showProductDetails(id) {
      const item = products.find(p => p.id === id);
      if (!item) return;

      const daysLeft = DashboardModule.getDaysRemaining(item.expiryDate);
      const statusInfo = DashboardModule.getItemStatus(item.expiryDate);

      let warrantyInfo = 'No warranty details';
      if (item.warrantyDate) {
        const wDays = DashboardModule.getDaysRemaining(item.warrantyDate);
        warrantyInfo = `${item.warrantyDate} (${wDays >= 0 ? `${wDays} days remaining` : 'Expired'})`;
      }

      const modalBody = document.getElementById('detailsModalBody');
      modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 48px; margin-bottom: 8px;">📦</div>
          <h2>${item.name}</h2>
          <span class="badge ${statusInfo.class}" style="margin-top: 8px; font-size: 14px; padding: 6px 14px;">${statusInfo.text}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-weight: 600; padding: 8px; width: 40%;">Category:</td>
            <td style="padding: 8px;">${item.category}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; padding: 8px;">Quantity:</td>
            <td style="padding: 8px;">${item.quantity}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; padding: 8px;">Expiry Date:</td>
            <td style="padding: 8px;">${item.expiryDate} (${daysLeft < 0 ? 'Expired' : `${daysLeft} days remaining`})</td>
          </tr>
          <tr>
            <td style="font-weight: 600; padding: 8px;">Warranty Expiry:</td>
            <td style="padding: 8px;">${warrantyInfo}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; padding: 8px;">Description:</td>
            <td style="padding: 8px;">${item.description || 'No description provided.'}</td>
          </tr>
        </table>
      `;

      document.getElementById('detailsModal').classList.add('show');
    },

    // Populate form fields for editing
    setupEditMode(id) {
      const item = products.find(p => p.id === id);
      if (!item || item.userId !== AuthModule.currentUser.id) return;

      currentEditId = id;
      document.getElementById('formTitle').textContent = 'Edit Product';
      document.getElementById('submitBtnText').textContent = 'Save Changes';
      document.getElementById('cancelEditBtn').style.display = 'inline-flex';

      // Prefill fields
      document.getElementById('productName').value = item.name;
      document.getElementById('productCategory').value = item.category;
      document.getElementById('productQuantity').value = item.quantity;
      document.getElementById('productExpiry').value = item.expiryDate;
      document.getElementById('productWarranty').value = item.warrantyDate || '';
      document.getElementById('productDesc').value = item.description || '';

      const suggestionMsg = document.getElementById('expirySuggestionMsg');
      if (suggestionMsg) suggestionMsg.style.display = 'none';

      // Auto scroll or jump to input view
      document.getElementById('inventoryFormSection').scrollIntoView({ behavior: 'smooth' });
    },

    // Cancel edit mode
    cancelEdit() {
      currentEditId = null;
      document.getElementById('productForm').reset();
      const formEl = document.getElementById('productForm');
      if (formEl) delete formEl.dataset.catalogProductId;
      document.getElementById('formTitle').textContent = 'Add Household Product';
      document.getElementById('submitBtnText').textContent = 'Add Product';
      document.getElementById('cancelEditBtn').style.display = 'none';
      const suggestionMsg = document.getElementById('expirySuggestionMsg');
      if (suggestionMsg) suggestionMsg.style.display = 'none';
      
      // Clear validation states
      document.querySelectorAll('#productForm .form-input').forEach(input => {
        input.classList.remove('is-invalid');
      });
    },

    // Delete item handler
    deleteProduct(id) {
      const item = products.find(p => p.id === id);
      if (!item || item.userId !== AuthModule.currentUser.id) return;

      if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        StorageModule.saveProducts(products);
        DashboardModule.updateDashboardMetrics(products);
        if (typeof ShoppingListModule !== 'undefined') {
          ShoppingListModule.syncShoppingList(products);
        }
        this.renderProductTable(products);
      }
    }
  };

  // Handle product form submission
  document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = {
      name: document.getElementById('productName').value.trim(),
      category: document.getElementById('productCategory').value,
      quantity: document.getElementById('productQuantity').value.trim(),
      expiryDate: document.getElementById('productExpiry').value,
      warrantyDate: document.getElementById('productWarranty').value,
      description: document.getElementById('productDesc').value
    };

    // Trigger validation
    if (!StorageModule.validateProductForm(formData)) {
      return;
    }

    if (currentEditId) {
      // Edit Mode
      products = products.map(item => {
        if (item.id === currentEditId) {
          // Merge formData into existing item to preserve id, userId, and hidden fields
          return { ...item, ...formData };
        }
        return item;
      });
      currentEditId = null;
    } else {
      // Add Mode
      const newProduct = {
        id: 'prod_' + Date.now(),
        userId: AuthModule.currentUser.id,
        ...formData
      };
      const formEl = document.getElementById('productForm');
      if (formEl && formEl.dataset.catalogProductId) {
        newProduct.catalogProductId = formEl.dataset.catalogProductId;
        delete formEl.dataset.catalogProductId;
      }
      products.push(newProduct);

      // SESSION STORAGE: track how many products were added during this browser tab session
      if (typeof SessionModule !== 'undefined') {
        SessionModule.trackItemAdded();
      }
    }

    // Save and render
    StorageModule.saveProducts(products);
    DashboardModule.updateDashboardMetrics(products);
    if (typeof ShoppingListModule !== 'undefined') {
      ShoppingListModule.syncShoppingList(products);
    }
    InventoryModule.renderProductTable(products);
    
    // Show success message
    const successMsg = document.getElementById('formSuccessMessage');
    if (successMsg) {
      successMsg.textContent = 'Product saved successfully.';
      successMsg.style.display = 'block';
      setTimeout(() => {
        successMsg.style.display = 'none';
      }, 3000);
    }

    InventoryModule.cancelEdit();
  });

  // Attach cancel edit listener
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    InventoryModule.cancelEdit();
  });

