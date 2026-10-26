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


  // Helper to resolve real product image or match from CatalogStore
  function resolveProductImage(item) {
    if (!item) return null;

    // 1. If item has a direct local image URL from assets, verify and use it
    if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '') {
      const trimmed = item.imageUrl.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return trimmed;
      }
    }

    // 2. If item has a catalogProductId, look it up in CatalogStore
    if (item.catalogProductId) {
      const catProd = CatalogStore.getProductById(item.catalogProductId);
      if (catProd && catProd.image) return catProd.image;
    }

    // 3. Robust keyword & alias matching against item name (word boundaries prevent false substring matches)
    const rawName = (item.name || '').toLowerCase().trim();
    if (!rawName) return null;

    const assetRules = [
      { regex: /\b(green\s*apple|red\s*apple|apples?)\b/i, not: /\b(pineapple|apple\s*cider)\b/i, file: './images/apple.jpeg' },
      { regex: /\b(bananas?|plantains?)\b/i, file: './images/banana.jpeg' },
      { regex: /\b(oranges?|mandarins?|tangerines?|clementines?)\b/i, file: './images/orange.jpeg' },
      { regex: /\b(mango(es)?|alphonso)\b/i, file: './images/mango.jpeg' },
      { regex: /\b(potatoes?|potato|aloo)\b/i, not: /\b(sweet\s*potato)\b/i, file: './images/potato.jpeg' },
      { regex: /\b(tomatoes?|tomato)\b/i, not: /\b(sauce|ketchup|paste)\b/i, file: './images/tomato.jpeg' },
      { regex: /\b(onions?|onion|shallots?|pyaz)\b/i, file: './images/onions.jpeg' },
      { regex: /\b(carrots?|carrot|gajar)\b/i, file: './images/carrot.jpeg' },
      { regex: /\b(milk|whole\s*milk|dairy\s*milk|toned\s*milk)\b/i, not: /\b(coconut\s*milk|almond\s*milk|soy\s*milk|milk\s*chocolate)\b/i, file: './images/milk.jpeg' },
      { regex: /\b(butter|makkhan)\b/i, not: /\b(peanut\s*butter|almond\s*butter)\b/i, file: './images/butter.jpeg' },
      { regex: /\b(cheese|cheddar|mozzarella|parmesan|gouda|paneer)\b/i, file: './images/cheese.jpeg' },
      { regex: /\b(greek\s*yogurt|yogurt|yoghurt|curd|dahi)\b/i, file: './images/greek_yogurt.jpeg' },
      { regex: /\b(dishwash\w*|dish\s*soap|dishwasher\s*liquid|dishwasher\s*gel|vim|pril)\b/i, file: './images/dishwash.jpeg' },
      { regex: /\b(detergent|laundry\s*powder|washing\s*powder|laundry\s*liquid|surf|tide|ariel)\b/i, file: './images/detergent.jpeg' },
      { regex: /\b(floor\s*cleaner|surface\s*cleaner|lizol|mop\s*cleaner)\b/i, file: './images/floorcleaner.jpeg' },
      { regex: /\b(saniti[sz]er|disinfectant\s*spray|antibacterial\s*spray|rubbing\s*alcohol)\b/i, file: './images/sanitizer.jpeg' },
      { regex: /\b(basmati|basmati\s*rice|rice|brown\s*rice|jasmine\s*rice|chawal)\b/i, not: /\b(rice\s*cake|rice\s*flour)\b/i, file: './images/rice.jpeg' },
      { regex: /\b(wheat\s*flour|whole\s*wheat|flour|atta|maida)\b/i, file: './images/wheat_flour.jpeg' },
      { regex: /\b(rolled\s*oats|oats?|oatmeal)\b/i, file: './images/rolledoats.jpeg' },
      { regex: /\b(quinoa)\b/i, file: './images/quinoa.jpeg' },
      { regex: /\b(olive\s*oil|cooking\s*oil|canola\s*oil|sunflower\s*oil|edible\s*oil)\b/i, file: './images/oliveoil.jpeg' },
      { regex: /\b(honey|wildflower\s*honey|raw\s*honey)\b/i, file: './images/honey.jpeg' },
      { regex: /\b(black\s*pepper|peppercorns?|kali\s*mirch)\b/i, file: './images/black_pepper.jpeg' },
      { regex: /\b(pink\s*salt|himalayan\s*salt|rock\s*salt|table\s*salt|sea\s*salt|salt)\b/i, file: './images/pinksalt.jpeg' },
      { regex: /\b(body\s*lotion|lotion|body\s*moisturi[sz]er|moisturi[sz]ing\s*lotion)\b/i, file: './images/bodylotion.jpeg' },
      { regex: /\b(face\s*wash|facewash|facial\s*cleanser|face\s*cleanser)\b/i, file: './images/himalyan_facewash.jpeg' },
      { regex: /\b(sunscreen|sunblock|spf\s*50|spf\s*30)\b/i, file: './images/sunscreen.jpeg' },
      { regex: /\b(electric\s*kettle|kettle)\b/i, file: './images/electric_kettle.jpeg' },
      { regex: /\b(blender|smoothie\s*maker|compact\s*blender|food\s*processor)\b/i, file: './images/blender.jpeg' },
      { regex: /\b(toaster|bread\s*toaster|2-slice\s*toaster|pop-up\s*toaster)\b/i, file: './images/twoslicebreadtoaster.jpeg' },
      { regex: /\b(paracetamol|painkiller|tylenol|panadol|acetaminophen|aspirin|crocin)\b/i, file: './images/paracetamol.png' },
      { regex: /\b(paper\s*towels?|kitchen\s*roll|kitchen\s*towels?|tissue\s*paper|tissues?|napkins?)\b/i, file: './images/papertowels.png' }
    ];

    for (const rule of assetRules) {
      if (rule.regex.test(rawName)) {
        if (!rule.not || !rule.not.test(rawName)) {
          return rule.file;
        }
      }
    }

    // 4. Exact catalog product match as fallback
    const allCat = CatalogStore.getAllProducts();
    const exactMatch = allCat.find(p => p.name.toLowerCase() === rawName);
    if (exactMatch && exactMatch.image) return exactMatch.image;

    // 5. If remote URL was given, use it if no local asset matched
    if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '') {
      return item.imageUrl.trim();
    }

    return null;
  }

  // Generates thumbnail markup with real image or clean typographic monogram
  function getThumbnailMarkup(item) {
    const imgUrl = resolveProductImage(item);
    const monogram = item.name ? item.name.trim().slice(0, 2).toUpperCase() : 'SS';
    const isPackaging = (item.category === 'Appliances' || item.category === 'Medicine');
    const imgClass = isPackaging ? 'product-thumbnail-img img-contain' : 'product-thumbnail-img';
    if (imgUrl) {
      return `
        <div class="product-thumbnail-box ${isPackaging ? 'box-contain' : ''}" aria-hidden="true">
          <img src="${imgUrl}" alt="${item.name}" class="${imgClass}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <span class="product-thumbnail-fallback" style="display: none;">${monogram}</span>
        </div>
      `;
    }
    return `
      <div class="product-thumbnail-box product-thumbnail-monogram" aria-hidden="true">
        <span class="product-thumbnail-fallback">${monogram}</span>
      </div>
    `;
  }

  // Checks whether one product matches the current search box, category
  // dropdown, and status dropdown.
  function productMatchesFilters(item, searchQuery, categoryFilter, statusFilter) {
    const nameMatches = item.name.toLowerCase().includes(searchQuery);
    const descriptionMatches = item.description && item.description.toLowerCase().includes(searchQuery);
    const matchesSearch = nameMatches || descriptionMatches;

    const matchesCategory = !categoryFilter || categoryFilter === 'All Categories' || item.category === categoryFilter;

    const statusInfo = DashboardModule.getItemStatus(item.expiryDate);
    const matchesStatus = !statusFilter || statusFilter === 'All Statuses' || statusInfo.text === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  }

  const InventoryModule = {
    currentViewMode: 'table', // 'table' | 'grid'

    // Resolves product image
    getProductImage(item) {
      return resolveProductImage(item);
    },

    // Generates thumbnail markup with image or monogram
    getThumbnailMarkup(item) {
      return getThumbnailMarkup(item);
    },

    // Renders the list table and retail grid based on filters, search, and sorting
    renderProductTable(productsList) {
      const tbody = document.getElementById('productTableBody');
      const gridContainer = document.getElementById('productGridWrapper');
      const recentBody = document.getElementById('recentTableBody');

      // Update Column Sort Glyphs in Table Header
      this.updateSortGlyphs();

      // Read filter inputs safely
      const searchInput = document.getElementById('searchInput');
      const categorySelect = document.getElementById('categoryFilter');
      const statusSelect = document.getElementById('statusFilter');

      const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const categoryFilter = categorySelect ? categorySelect.value : 'All Categories';
      const statusFilter = statusSelect ? statusSelect.value : 'All Statuses';

      // Keep only matching items
      let filtered = [];
      for (let i = 0; i < productsList.length; i++) {
        const item = productsList[i];
        if (productMatchesFilters(item, searchQuery, categoryFilter, statusFilter)) {
          filtered.push(item);
        }
      }

      // Apply Sort
      filtered = DashboardModule.sortProducts(filtered, sortField, sortDirection);

      // 1. RENDER TABLE VIEW
      if (tbody) {
        tbody.innerHTML = '';
        if (filtered.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 36px 16px;">No products match the selected filters.</td></tr>`;
        } else {
          filtered.forEach(item => {
            const statusInfo = DashboardModule.getItemStatus(item.expiryDate);
            const daysLeft = DashboardModule.getDaysRemaining(item.expiryDate);
            
            let countdownPill = '';
            if (daysLeft === Infinity) {
              countdownPill = '<span class="table-relative-pill pill-muted">No date</span>';
            } else if (daysLeft < 0) {
              countdownPill = `<span class="table-relative-pill pill-danger">${Math.abs(daysLeft)}d expired</span>`;
            } else if (daysLeft === 0) {
              countdownPill = `<span class="table-relative-pill pill-warn">Today</span>`;
            } else if (daysLeft <= 7) {
              countdownPill = `<span class="table-relative-pill pill-warn">${daysLeft}d left</span>`;
            } else {
              countdownPill = `<span class="table-relative-pill pill-safe">${daysLeft}d left</span>`;
            }

            const tr = document.createElement('tr');
            tr.className = 'inventory-table-row';
            tr.innerHTML = `
              <td class="col-product">
                <div class="product-cell">
                  ${getThumbnailMarkup(item)}
                  <div class="product-info-col">
                    <span class="product-name" title="${item.name}">${item.name}</span>
                    <span class="product-meta">${item.description || item.category}</span>
                  </div>
                </div>
              </td>
              <td class="col-category"><span class="table-category-tag">${item.category}</span></td>
              <td class="col-quantity"><strong class="table-quantity-val">${item.quantity}</strong></td>
              <td class="col-expiry">
                <div class="table-expiry-wrap">
                  <span class="table-date-val">${item.expiryDate || '—'}</span>
                  ${countdownPill}
                </div>
              </td>
              <td class="col-status"><span class="badge ${statusInfo.class}">${statusInfo.text}</span></td>
              <td class="col-actions" style="text-align: right;">
                <div class="table-actions">
                  <button type="button" class="table-btn table-btn-shop action-shop" data-id="${item.id}" title="Add to shopping list">+ List</button>
                  <button type="button" class="table-btn table-btn-secondary action-edit" data-id="${item.id}" title="Edit product">Edit</button>
                  <button type="button" class="table-btn table-btn-secondary action-view" data-id="${item.id}" title="View details">View</button>
                  <button type="button" class="table-btn table-btn-danger action-delete" data-id="${item.id}" title="Delete product">Delete</button>
                </div>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      }

      // 2. RENDER RETAIL PRODUCT GRID VIEW
      if (gridContainer) {
        gridContainer.innerHTML = '';
        if (filtered.length === 0) {
          gridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; border: 1px dashed var(--border-hairline); border-radius: var(--radius); background: var(--surface-panel);">
              <p style="font-size: 13px; color: var(--text-muted); font-weight: 500;">No products found matching active filters.</p>
            </div>
          `;
        } else {
          filtered.forEach(item => {
            const statusInfo = DashboardModule.getItemStatus(item.expiryDate);
            const daysLeft = DashboardModule.getDaysRemaining(item.expiryDate);
            const imgUrl = resolveProductImage(item);
            const monogram = item.name ? item.name.trim().slice(0, 2).toUpperCase() : 'SS';

            let daysText = daysLeft < 0 ? `${Math.abs(daysLeft)}d expired` : (daysLeft === 0 ? 'Expires today' : `${daysLeft}d left`);
            if (daysLeft === Infinity) daysText = 'No date';

            const card = document.createElement('div');
            card.className = 'retail-card';
            card.innerHTML = `
              <div class="retail-card-header">
                <span class="retail-card-cat-pill">${item.category}</span>
                <span class="badge ${statusInfo.class}">${daysText}</span>
              </div>
              <div class="retail-card-image-box">
                ${imgUrl ? 
                  `<img src="${imgUrl}" alt="${item.name}" class="retail-card-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="retail-card-fallback" style="display:none;"><span class="retail-card-monogram">${monogram}</span><span class="retail-card-fallback-sub">${item.category}</span></div>` : 
                  `<div class="retail-card-fallback"><span class="retail-card-monogram">${monogram}</span><span class="retail-card-fallback-sub">${item.category}</span></div>`
                }
              </div>
              <div class="retail-card-content">
                <h4 class="retail-card-title" title="${item.name}">${item.name}</h4>
                <div class="retail-card-meta">
                  <span class="retail-card-qty">${item.quantity}</span>
                  <span class="retail-card-date">${item.expiryDate || 'No date'}</span>
                </div>
              </div>
              <div class="retail-card-actions">
                <button type="button" class="table-btn table-btn-shop action-shop" data-id="${item.id}" title="Add to Shopping List" style="flex: 1.4;">+ List</button>
                <button type="button" class="table-btn table-btn-secondary action-edit" data-id="${item.id}" style="flex: 1;">Edit</button>
                <button type="button" class="table-btn table-btn-secondary action-view" data-id="${item.id}" style="flex: 1;">View</button>
                <button type="button" class="table-btn table-btn-danger action-delete" data-id="${item.id}" title="Delete product" style="width: 28px; padding: 0;">✕</button>
              </div>
            `;
            gridContainer.appendChild(card);
          });
        }
      }

      // 3. POPULATE DASHBOARD RECENT ITEMS TABLE (Max 5)
      if (recentBody) {
        recentBody.innerHTML = '';
        const recentItems = productsList.slice(-5).reverse();
        if (recentItems.length === 0) {
          recentBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No products added yet.</td></tr>`;
        } else {
          recentItems.forEach(item => {
            const statusInfo = DashboardModule.getItemStatus(item.expiryDate);
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>
                <div class="product-cell">
                  ${getThumbnailMarkup(item)}
                  <span class="product-name">${item.name}</span>
                </div>
              </td>
              <td>${item.category}</td>
              <td><strong>${item.quantity}</strong></td>
              <td><span style="font-family: var(--font-mono);">${item.expiryDate}</span></td>
              <td><span class="badge ${statusInfo.class}">${statusInfo.text}</span></td>
              <td style="text-align: right;">
                <button type="button" class="table-btn table-btn-secondary action-view" data-id="${item.id}">View</button>
              </td>
            `;
            recentBody.appendChild(tr);
          });
        }
      }

      // 4. ATTACH DYNAMIC ACTION LISTENERS
      document.querySelectorAll('.action-view').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.showProductDetails(btn.dataset.id);
        };
      });
      document.querySelectorAll('.action-edit').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.setupEditMode(btn.dataset.id);
        };
      });
      document.querySelectorAll('.action-shop').forEach(btn => {
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
            const orig = btn.innerHTML;
            btn.innerHTML = '✓ Added';
            btn.style.color = 'var(--primary-forest)';
            setTimeout(() => {
              btn.innerHTML = orig;
              btn.style.color = '';
            }, 1200);
          }
        };
      });
      document.querySelectorAll('.action-delete').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.deleteProduct(btn.dataset.id);
        };
      });
    },

    // Updates active sort indicators on table headers
    updateSortGlyphs() {
      const glyphs = {
        name: document.getElementById('sortGlyphName'),
        category: document.getElementById('sortGlyphCategory'),
        quantity: document.getElementById('sortGlyphQuantity'),
        expiryDate: document.getElementById('sortGlyphExpiry')
      };

      Object.keys(glyphs).forEach(field => {
        const el = glyphs[field];
        if (!el) return;
        if (sortField === field) {
          el.textContent = sortDirection === 'asc' ? ' ▲' : ' ▼';
          el.style.color = 'var(--primary-forest)';
        } else {
          el.textContent = ' ▲▼';
          el.style.color = 'var(--text-muted)';
        }
      });
    },

    // Sets view mode between 'table' and 'grid'
    setViewMode(mode) {
      this.currentViewMode = mode;
      const tableWrapper = document.getElementById('productTableWrapper');
      const gridWrapper = document.getElementById('productGridWrapper');
      const tableBtn = document.getElementById('viewModeTableBtn');
      const gridBtn = document.getElementById('viewModeGridBtn');

      if (mode === 'grid') {
        if (tableWrapper) tableWrapper.style.display = 'none';
        if (gridWrapper) gridWrapper.style.display = 'grid';
        if (tableBtn) tableBtn.classList.remove('active');
        if (gridBtn) gridBtn.classList.add('active');
      } else {
        if (tableWrapper) tableWrapper.style.display = 'block';
        if (gridWrapper) gridWrapper.style.display = 'none';
        if (tableBtn) tableBtn.classList.add('active');
        if (gridBtn) gridBtn.classList.remove('active');
      }
    },

    // Opens the Slide-Over Drawer
    openDrawer() {
      const backdrop = document.getElementById('inventoryDrawerBackdrop');
      if (backdrop) {
        backdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    },

    // Closes the Slide-Over Drawer
    closeDrawer() {
      const backdrop = document.getElementById('inventoryDrawerBackdrop');
      if (backdrop) {
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
      }
    },

    // Displays the modal details view
    showProductDetails(id) {
      const item = products.find(p => p.id === id);
      if (!item) return;

      const daysLeft = DashboardModule.getDaysRemaining(item.expiryDate);
      const statusInfo = DashboardModule.getItemStatus(item.expiryDate);
      const imgUrl = resolveProductImage(item);
      const monogram = item.name ? item.name.trim().slice(0, 2).toUpperCase() : 'SS';

      let warrantyInfo = 'No warranty specified';
      if (item.warrantyDate) {
        const wDays = DashboardModule.getDaysRemaining(item.warrantyDate);
        warrantyInfo = `${item.warrantyDate} (${wDays >= 0 ? `${wDays} days remaining` : 'Expired'})`;
      }

      const modalBody = document.getElementById('detailsModalBody');
      modalBody.innerHTML = `
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border-hairline);">
          <div style="width: 64px; height: 64px; min-width: 64px; border-radius: var(--radius); background: var(--surface-subdued); border: 1px solid var(--border-hairline); display: flex; align-items: center; justify-content: center; overflow: hidden;">
            ${imgUrl ? `<img src="${imgUrl}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:20px;font-weight:700;">${monogram}</span>`}
          </div>
          <div>
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">${item.category}</span>
            <h2 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 2px 0 6px;">${item.name}</h2>
            <span class="badge ${statusInfo.class}">${statusInfo.text}</span>
          </div>
        </div>

        <table style="width: 100%; font-size: 12.5px;">
          <tr>
            <td style="font-weight: 600; color: var(--text-secondary); width: 35%; padding: 8px 0;">Quantity:</td>
            <td style="padding: 8px 0;"><strong>${item.quantity}</strong></td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: var(--text-secondary); padding: 8px 0;">Expiry Date:</td>
            <td style="padding: 8px 0;"><span style="font-family: var(--font-mono);">${item.expiryDate} (${daysLeft < 0 ? 'Expired' : `${daysLeft} days left`})</span></td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: var(--text-secondary); padding: 8px 0;">Warranty End:</td>
            <td style="padding: 8px 0;"><span style="font-family: var(--font-mono);">${warrantyInfo}</span></td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: var(--text-secondary); padding: 8px 0; vertical-align: top;">Notes:</td>
            <td style="padding: 8px 0; color: var(--text-secondary);">${item.description || 'No description provided.'}</td>
          </tr>
        </table>
      `;

      document.getElementById('detailsModal').classList.add('show');
    },

    // Setup Add Mode
    setupAddMode() {
      currentEditId = null;
      document.getElementById('productForm').reset();
      const formEl = document.getElementById('productForm');
      if (formEl) delete formEl.dataset.catalogProductId;
      document.getElementById('formTitle').textContent = 'Add Product';
      document.getElementById('submitBtnText').textContent = 'Save Product';
      const suggestionMsg = document.getElementById('expirySuggestionMsg');
      if (suggestionMsg) suggestionMsg.style.display = 'none';
      const imgInput = document.getElementById('productImage');
      const imgUrl = document.getElementById('productImageUrl');
      const previewBox = document.getElementById('productImagePreview');
      const statusEl = document.getElementById('productImageStatus');
      if (imgInput) imgInput.value = '';
      if (imgUrl) imgUrl.value = '';
      if (previewBox) previewBox.style.display = 'none';
      if (statusEl) statusEl.style.display = 'none';
      document.querySelectorAll('#productForm .form-input').forEach(input => {
        input.classList.remove('is-invalid');
      });
      this.openDrawer();
    },

    // Populate form fields for editing
    setupEditMode(id) {
      const item = products.find(p => p.id === id);
      if (!item || item.userId !== AuthModule.currentUser.id) return;

      currentEditId = id;
      document.getElementById('formTitle').textContent = 'Edit Product';
      document.getElementById('submitBtnText').textContent = 'Save Changes';

      // Prefill fields
      document.getElementById('productName').value = item.name;
      document.getElementById('productCategory').value = item.category;
      document.getElementById('productQuantity').value = item.quantity;
      document.getElementById('productExpiry').value = item.expiryDate;
      document.getElementById('productWarranty').value = item.warrantyDate || '';
      document.getElementById('productDesc').value = item.description || '';

      const imgInput = document.getElementById('productImage');
      const imgUrl = document.getElementById('productImageUrl');
      const previewBox = document.getElementById('productImagePreview');
      const previewImg = document.getElementById('productImagePreviewImg');
      const fileNameSpan = document.getElementById('productImageFileName');
      const statusEl = document.getElementById('productImageStatus');
      if (imgInput) imgInput.value = '';
      if (statusEl) statusEl.style.display = 'none';
      if (item.imageUrl) {
        if (imgUrl) imgUrl.value = item.imageUrl;
        if (previewImg) previewImg.src = resolveProductImage(item) || item.imageUrl;
        if (fileNameSpan) fileNameSpan.textContent = item.imageUrl.split('/').pop() || 'Current Photo';
        if (previewBox) previewBox.style.display = 'flex';
      } else {
        if (imgUrl) imgUrl.value = '';
        if (previewBox) previewBox.style.display = 'none';
      }

      const suggestionMsg = document.getElementById('expirySuggestionMsg');
      if (suggestionMsg) suggestionMsg.style.display = 'none';

      this.openDrawer();
    },

    // Cancel edit mode
    cancelEdit() {
      currentEditId = null;
      document.getElementById('productForm').reset();
      const formEl = document.getElementById('productForm');
      if (formEl) delete formEl.dataset.catalogProductId;
      document.getElementById('formTitle').textContent = 'Add Product';
      document.getElementById('submitBtnText').textContent = 'Save Product';
      const suggestionMsg = document.getElementById('expirySuggestionMsg');
      if (suggestionMsg) suggestionMsg.style.display = 'none';
      const imgInput = document.getElementById('productImage');
      const imgUrl = document.getElementById('productImageUrl');
      const previewBox = document.getElementById('productImagePreview');
      const statusEl = document.getElementById('productImageStatus');
      if (imgInput) imgInput.value = '';
      if (imgUrl) imgUrl.value = '';
      if (previewBox) previewBox.style.display = 'none';
      if (statusEl) statusEl.style.display = 'none';
      
      document.querySelectorAll('#productForm .form-input').forEach(input => {
        input.classList.remove('is-invalid');
      });
      this.closeDrawer();
    },

    // Delete item handler
    deleteProduct(id) {
      const item = products.find(p => p.id === id);
      if (!item || item.userId !== AuthModule.currentUser.id) return;

      showConfirm('Delete Product?', `Are you sure you want to delete "${item.name}" from your shelf?`, () => {
        products = products.filter(p => p.id !== id);
        StorageModule.saveProducts(products);
        DashboardModule.updateDashboardMetrics(products);
        if (typeof ShoppingListModule !== 'undefined') {
          ShoppingListModule.syncShoppingList(products);
        }
        this.renderProductTable(products);
        showNotification('Product deleted from inventory.', 'success');
      }, 'Delete');
    }
  };

  // Wire Drawer and View Mode Switchers
  const openAddBtn = document.getElementById('openAddDrawerBtn');
  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => InventoryModule.setupAddMode());
  }

  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', () => InventoryModule.closeDrawer());
  }

  const drawerBackdrop = document.getElementById('inventoryDrawerBackdrop');
  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', (e) => {
      if (e.target === drawerBackdrop) InventoryModule.closeDrawer();
    });
  }

  const viewModeTableBtn = document.getElementById('viewModeTableBtn');
  if (viewModeTableBtn) {
    viewModeTableBtn.addEventListener('click', () => InventoryModule.setViewMode('table'));
  }

  const viewModeGridBtn = document.getElementById('viewModeGridBtn');
  if (viewModeGridBtn) {
    viewModeGridBtn.addEventListener('click', () => InventoryModule.setViewMode('grid'));
  }

  // Handle Multer image upload
  const productImageInput = document.getElementById('productImage');
  if (productImageInput) {
    productImageInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        showNotification('Only JPEG, PNG or WebP images are allowed.', 'error');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Photo must be 5MB or smaller.', 'error');
        e.target.value = '';
        return;
      }
      const token = localStorage.getItem('safeshelf_auth_token');
      if (!token) {
        showNotification('Sign in before uploading product photos.', 'warning');
        return;
      }
      const statusEl = document.getElementById('productImageStatus');
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.textContent = 'Uploading photo…';
      }
      const formData = new FormData();
      formData.append('image', file);
      try {
        const response = await fetch('/api/uploads/image', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload failed.');
        const imgUrl = document.getElementById('productImageUrl');
        if (imgUrl) imgUrl.value = data.url;
        const previewBox = document.getElementById('productImagePreview');
        const previewImg = document.getElementById('productImagePreviewImg');
        const nameSpan = document.getElementById('productImageFileName');
        if (previewImg) previewImg.src = data.url;
        if (nameSpan) nameSpan.textContent = file.name;
        if (previewBox) previewBox.style.display = 'flex';
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.textContent = '✓ Photo uploaded';
        }
        showNotification('Photo uploaded successfully.', 'success');
      } catch (err) {
        if (statusEl) statusEl.style.display = 'none';
        showNotification(err.message || 'Image upload failed.', 'error');
        e.target.value = '';
      }
    });
  }

  const removePhotoBtn = document.getElementById('removeProductImageBtn');
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
      const imgInput = document.getElementById('productImage');
      const imgUrl = document.getElementById('productImageUrl');
      const previewBox = document.getElementById('productImagePreview');
      const statusEl = document.getElementById('productImageStatus');
      if (imgInput) imgInput.value = '';
      if (imgUrl) imgUrl.value = '';
      if (previewBox) previewBox.style.display = 'none';
      if (statusEl) statusEl.style.display = 'none';
      showNotification('Photo removed.', 'info');
    });
  }

  // Handle product form submission
  document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const customImageUrl = (document.getElementById('productImageUrl') ? document.getElementById('productImageUrl').value : '').trim();

    const formData = {
      name: document.getElementById('productName').value.trim(),
      category: document.getElementById('productCategory').value,
      quantity: document.getElementById('productQuantity').value.trim(),
      expiryDate: document.getElementById('productExpiry').value,
      warrantyDate: document.getElementById('productWarranty').value,
      description: document.getElementById('productDesc').value,
      imageUrl: customImageUrl
    };

    // Trigger validation
    if (!StorageModule.validateProductForm(formData)) {
      return;
    }

    if (currentEditId) {
      // Edit Mode
      products = products.map(item => {
        if (item.id === currentEditId) {
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

      // SESSION STORAGE: track item added in tab session
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
    
    showNotification('Product saved to your shelf.', 'success');
    InventoryModule.cancelEdit();
  });

  // Attach cancel edit listener
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      InventoryModule.cancelEdit();
    });
  }

