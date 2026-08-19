/**
 * SAFESHELF — auth.js
 * ------------------------------------------------------------
 * Authentication, Session & Data Persistence
 * ------------------------------------------------------------
 * Contains:
 *   - Shared application state (used across all modules/files)
 *   - SessionModule   -> sessionStorage (tab-only session stats)
 *   - AuthModule      -> login / register / logout / profile / localStorage
 *   - StorageModule   -> localStorage persistence + form validation
 *
 * NOTE ON FILE SPLITTING:
 * All SafeShelf JS files are loaded as classic <script> tags (not ES
 * modules) at the end of <body>, in this order:
 *   auth.js -> inventory.js -> features.js -> dashboard.js
 * Classic scripts share ONE global scope, so a `let`/`const` declared
 * here is visible to every file loaded after it. This is what lets
 * four separate files behave as one connected application.
 * ------------------------------------------------------------
 */

// ==========================================
// SHARED APPLICATION STATE (Topics 1-2: let/const, Data Types)
// ==========================================
let products = [];
let currentEditId = null;
let sortField = 'expiryDate';
let sortDirection = 'asc';

// ==========================================
// SESSION STORAGE MODULE (Topic 23: Session Storage)
// ------------------------------------------------------------
// Tracks activity for the CURRENT BROWSER TAB ONLY. Unlike
// localStorage (used by AuthModule/StorageModule below), this data
// disappears the moment the tab/window is closed - perfect for
// short-lived, non-critical session statistics.
// ==========================================
const SessionModule = {
  KEY: 'safeshelf_session_activity',

  getStats() {
    try {
      const raw = sessionStorage.getItem(this.KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading session storage', e);
    }
    return { sessionStart: new Date().toISOString(), itemsAdded: 0, searchesRun: 0 };
  },

  saveStats(stats) {
    try {
      sessionStorage.setItem(this.KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('Error writing session storage', e);
    }
  },

  init() {
    // Only create a fresh record if this tab has no session data yet
    if (!sessionStorage.getItem(this.KEY)) {
      this.saveStats({ sessionStart: new Date().toISOString(), itemsAdded: 0, searchesRun: 0 });
    }
    this.render();
  },

  trackItemAdded() {
    const stats = this.getStats();
    stats.itemsAdded += 1;
    this.saveStats(stats);
    this.render();
  },

  trackSearch() {
    const stats = this.getStats();
    stats.searchesRun += 1;
    this.saveStats(stats);
    this.render();
  },

  // Renders the "This Session" widget on the Profile page (session-only stats)
  render() {
    const stats = this.getStats();
    const startEl = document.getElementById('sessionStartTime');
    const addedEl = document.getElementById('sessionItemsAdded');
    const searchEl = document.getElementById('sessionSearchesRun');

    if (startEl) {
      const start = new Date(stats.sessionStart);
      startEl.textContent = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (addedEl) addedEl.textContent = stats.itemsAdded;
    if (searchEl) searchEl.textContent = stats.searchesRun;
  },

  clear() {
    sessionStorage.removeItem(this.KEY);
  }
};

// ==========================================
// AUTHENTICATION & USER PROFILE MODULE (Topics 15-24: Objects, DOM, Forms, localStorage)
// ==========================================
const AuthModule = {
  USERS_KEY: 'safeshelf_users',
  CURRENT_USER_KEY: 'safeshelf_current_user',
  currentUser: null,

  init() {
    const users = this.getUsers();
    if (!users.find(u => u.email === 'demo@safeshelf.com')) {
      users.push({
        id: 'demo-1',
        name: 'Demo User',
        email: 'demo@safeshelf.com',
        password: 'password',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    this.currentUser = this.getCurrentUser();

    const appContainer = document.getElementById('appContainer');
    const authContainer = document.getElementById('authContainer');
    const bottomNav = document.querySelector('.bottom-nav');

    if (this.currentUser) {
      if (authContainer) authContainer.style.display = 'none';
      if (appContainer) appContainer.style.display = 'flex';
      if (bottomNav) bottomNav.style.removeProperty('display');
      this.updateUserUI();
    } else {
      if (authContainer) authContainer.style.display = 'flex';
      if (appContainer) appContainer.style.display = 'none';
      if (bottomNav) bottomNav.style.display = 'none';
    }

    this.bindEvents();
  },

  getUsers() {
    try {
      const data = localStorage.getItem(this.USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(this.CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  updateUserUI() {
    if (!this.currentUser) return;

    const greetingEl = document.getElementById('dashboardGreeting');
    if (greetingEl) {
      const hour = new Date().getHours();
      let timeGreeting = 'Good evening';
      if (hour < 12) timeGreeting = 'Good morning';
      else if (hour < 18) timeGreeting = 'Good afternoon';

      greetingEl.textContent = `${timeGreeting}, ${this.currentUser.name.split(' ')[0]} 👋`;
    }

    const navAvatar = document.getElementById('navAvatar');
    if (navAvatar) {
      navAvatar.textContent = this.currentUser.name.charAt(0).toUpperCase();
    }

    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      const nameSpan = profileBtn.querySelector('.profile-name');
      if (nameSpan) {
        nameSpan.textContent = this.currentUser.name.split(' ')[0];
      }
    }

    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) {
      const firstLi = profileDropdown.querySelector('li');
      if (firstLi) {
        firstLi.innerHTML = `<div style="font-weight: 600;">${this.currentUser.name}</div><div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${this.currentUser.email}</div>`;
      }
    }

    const notifsEnabled = this.currentUser.notificationsEnabled !== false;
    const reminderDays = this.currentUser.reminderDays ? this.currentUser.reminderDays : 7;

    const notifToggle = document.getElementById('prefNotifToggle');
    if (notifToggle) notifToggle.checked = notifsEnabled;

    const reminderSelect = document.getElementById('prefReminderSelect');
    if (reminderSelect) reminderSelect.value = reminderDays.toString();

    // Refresh the "This Session" widget (sessionStorage stats) whenever the user UI updates
    if (typeof SessionModule !== 'undefined') SessionModule.render();
  },

  bindEvents() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');

    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        loginError.textContent = '';
        registerError.textContent = '';
      });
    }

    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', () => {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        loginError.textContent = '';
        registerError.textContent = '';
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;

        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
          loginError.textContent = '';
          const sessionUser = this.toSessionUser(user);
          localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(sessionUser));
          this.currentUser = sessionUser;
          location.reload();
        } else {
          loginError.textContent = 'Invalid email or password.';
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirm').value;

        if (name.length < 2) return registerError.textContent = 'Please enter your full name.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return registerError.textContent = 'Please enter a valid email.';
        if (password.length < 6) return registerError.textContent = 'Password must contain at least 6 characters.';
        if (password !== confirmPassword) return registerError.textContent = 'Passwords do not match.';

        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
          return registerError.textContent = 'An account with this email already exists.';
        }

        const newUser = {
          id: 'user-' + Date.now(),
          name,
          email,
          password,
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        loginError.textContent = 'Account created successfully. Please login.';
        loginError.style.color = 'var(--primary)';
      });
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('profileName').value.trim();
        const profileMessage = document.getElementById('profileMessage');

        if (!newName) {
          profileMessage.style.color = 'var(--danger)';
          return profileMessage.textContent = 'Name is required.';
        }

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex === -1) return;

        users[userIndex].name = newName;
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

        this.currentUser.name = newName;
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this.currentUser));

        this.updateUserUI();

        const profilePageName = document.getElementById('profilePageName');
        if (profilePageName) profilePageName.textContent = newName;
        const profilePageAvatar = document.getElementById('profilePageAvatar');
        if (profilePageAvatar) profilePageAvatar.textContent = newName.charAt(0).toUpperCase();

        profileMessage.style.color = 'var(--primary)';
        profileMessage.textContent = 'Profile updated successfully.';
      });
    }

    // Notification Preferences handlers
    const notifToggle = document.getElementById('prefNotifToggle');
    if (notifToggle) {
      notifToggle.addEventListener('change', (e) => {
        if (!this.currentUser) return;
        this.currentUser.notificationsEnabled = e.target.checked;

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
          users[userIndex].notificationsEnabled = this.currentUser.notificationsEnabled;
          localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        }
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this.currentUser));

        const products = typeof StorageModule !== 'undefined' ? StorageModule.loadProducts() : [];
        if (typeof DashboardModule !== 'undefined') {
          DashboardModule.updateNotifications(products);
        }
      });
    }

    const reminderSelect = document.getElementById('prefReminderSelect');
    if (reminderSelect) {
      reminderSelect.addEventListener('change', (e) => {
        if (!this.currentUser) return;
        let val = parseInt(e.target.value, 10);
        if (![3, 7, 14, 30].includes(val)) val = 7;

        this.currentUser.reminderDays = val;

        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
          users[userIndex].reminderDays = this.currentUser.reminderDays;
          localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        }
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this.currentUser));

        const products = typeof StorageModule !== 'undefined' ? StorageModule.loadProducts() : [];
        if (typeof DashboardModule !== 'undefined') {
          DashboardModule.updateNotifications(products);
        }
      });
    }
    // Note: "Visit Profile", "Logout" and "Clear Inventory" buttons are wired up
    // in NavigationModule (see js/dashboard.js) since they trigger view navigation.
  },

  logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    location.reload();
  },

  toSessionUser(user) {
    const { password, ...sessionUser } = user;
    return sessionUser;
  }
};

  const StorageModule = {
    STORAGE_KEY: 'safeshelf_inventory_data',
    SHOPPING_LIST_KEY: 'safeshelf_shopping_list',

    // Safe numeric quantity extractor (e.g. "2 kg" -> 2, "1 jar" -> 1, "0" -> 0)
    getNumericQuantity(quantityStr) {
      if (typeof quantityStr === 'number') return isNaN(quantityStr) ? 0 : quantityStr;
      if (!quantityStr || typeof quantityStr !== 'string') return 0;
      const match = quantityStr.trim().match(/^([0-9]+(?:\.[0-9]+)?)/);
      return match ? parseFloat(match[1]) : 0;
    },

    // Stock state helpers
    isOutOfStock(quantityStr) {
      return this.getNumericQuantity(quantityStr) <= 0;
    },

    isLowStock(quantityStr, threshold = 1) {
      const qty = this.getNumericQuantity(quantityStr);
      return qty > 0 && qty <= threshold;
    },

    // Load user-scoped shopping list from localStorage
    loadShoppingList(userId) {
      try {
        const uid = userId || (AuthModule.currentUser ? AuthModule.currentUser.id : null);
        if (!uid) return [];
        const raw = localStorage.getItem(this.SHOPPING_LIST_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);

        // Support array-of-users format: [{ userId: "...", items: [...] }]
        if (Array.isArray(parsed)) {
          const userEntry = parsed.find(u => u && u.userId === uid);
          return userEntry && Array.isArray(userEntry.items) ? userEntry.items : [];
        }

        // Support object dictionary format: { "userId": [...] }
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed[uid])) return parsed[uid];
        }

        return [];
      } catch (e) {
        console.error('Error loading shopping list from localStorage', e);
        return [];
      }
    },

    // Save user-scoped shopping list to localStorage
    saveShoppingList(userId, items) {
      try {
        const uid = userId || (AuthModule.currentUser ? AuthModule.currentUser.id : null);
        if (!uid) return;
        const raw = localStorage.getItem(this.SHOPPING_LIST_KEY);
        let allLists = [];

        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              allLists = parsed;
            } else if (parsed && typeof parsed === 'object') {
              // Convert legacy object to standard array format
              Object.keys(parsed).forEach(k => {
                if (Array.isArray(parsed[k])) {
                  allLists.push({ userId: k, items: parsed[k] });
                }
              });
            }
          } catch (err) {
            allLists = [];
          }
        }

        // Filter out current user's old entry and insert updated list
        allLists = allLists.filter(u => u && u.userId !== uid);
        allLists.push({ userId: uid, items: items || [] });
        localStorage.setItem(this.SHOPPING_LIST_KEY, JSON.stringify(allLists));
      } catch (e) {
        console.error('Error saving shopping list to localStorage', e);
      }
    },

    // Load data from localStorage
    loadProducts() {
      try {
        const userId = AuthModule.currentUser ? AuthModule.currentUser.id : null;
        if (!userId) return [];

        const userKey = `${this.STORAGE_KEY}_${userId}`;
        const savedUserData = localStorage.getItem(userKey);
        if (savedUserData) return JSON.parse(savedUserData);

        // Read the old shared store once so existing users keep their data.
        const legacyData = localStorage.getItem(this.STORAGE_KEY);
        const legacyProducts = legacyData ? JSON.parse(legacyData) : [];
        const existingUserProducts = Array.isArray(legacyProducts)
          ? legacyProducts.filter(product => product && product.userId === userId)
          : [];
        const initialProducts = existingUserProducts.length > 0
          ? existingUserProducts
          : userId === 'demo-1' ? this.getSeedData() : [];

        localStorage.setItem(userKey, JSON.stringify(initialProducts));
        return initialProducts;
      } catch (e) {
        console.error('Error loading data from localStorage', e);
        return [];
      }
    },

    // Save data to localStorage
    saveProducts(productsList) {
      if (!AuthModule.currentUser) return;
      try {
        const userKey = `${this.STORAGE_KEY}_${AuthModule.currentUser.id}`;
        const ownedProducts = (productsList || [])
          .filter(product => product && (!product.userId || product.userId === AuthModule.currentUser.id))
          .map(product => ({ ...product, userId: AuthModule.currentUser.id }));
        localStorage.setItem(userKey, JSON.stringify(ownedProducts));
      } catch (e) {
        console.error('Error saving data to localStorage', e);
      }
    },

    // Form inputs validator
    validateProductForm(formData) {
      let isValid = true;
      
      // Clear previous error styles only for this form
      document.querySelectorAll('#productForm .form-input').forEach(input => {
        input.classList.remove('is-invalid');
      });

      // 1. Name validation
      const nameVal = formData.name ? formData.name.trim() : '';
      if (nameVal === '') {
        this.setError('productName', 'Product name is required.');
        isValid = false;
      } else if (nameVal.length > 100) {
        this.setError('productName', 'Name cannot exceed 100 characters.');
        isValid = false;
      }

      // 2. Category validation
      if (!formData.category || formData.category === '') {
        this.setError('productCategory', 'Please select a valid category.');
        isValid = false;
      }

      // 3. Quantity validation
      const qVal = formData.quantity ? formData.quantity.trim() : '';
      if (qVal === '') {
        this.setError('productQuantity', 'Quantity is required.');
        isValid = false;
      } else if (qVal.startsWith('-')) {
        this.setError('productQuantity', 'Quantity cannot be negative.');
        isValid = false;
      } else if (!/[a-zA-Z0-9]/.test(qVal)) {
        this.setError('productQuantity', 'Quantity cannot contain only symbols.');
        isValid = false;
      }

      // 4. Expiry Date validation
      if (!formData.expiryDate) {
        this.setError('productExpiry', 'Expiry date is required.');
        isValid = false;
      } else {
        const parsed = Date.parse(formData.expiryDate);
        if (isNaN(parsed)) {
          this.setError('productExpiry', 'Invalid expiry date format.');
          isValid = false;
        }
      }

      // 5. Warranty Date validation
      if (formData.warrantyDate) {
        const parsedW = Date.parse(formData.warrantyDate);
        if (isNaN(parsedW)) {
          this.setError('productWarranty', 'Invalid warranty date format.');
          isValid = false;
        }
      }

      return isValid;
    },

    setError(id, message) {
      const inputEl = document.getElementById(id);
      if (inputEl) {
        inputEl.classList.add('is-invalid');
        const feedbackEl = inputEl.nextElementSibling;
        if (feedbackEl && feedbackEl.classList.contains('invalid-feedback')) {
          feedbackEl.textContent = message;
        }
      }
    },

    // Default Seed Data to pre-populate and look beautiful immediately
    getSeedData() {
      const today = new Date();
      
      // Helper to offset dates
      const getOffsetDate = (days) => {
        const d = new Date(today);
        d.setDate(today.getDate() + days);
        return d.toISOString().split('T')[0];
      };

      return [
        {
          id: 'seed-1',
          userId: 'demo-1',
          name: 'Organic Basmati Rice',
          category: 'Food Grains',
          quantity: '2 kg',
          expiryDate: getOffsetDate(11),
          warrantyDate: '',
          imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=120',
          description: 'Premium long grain basmati rice stored in pantry container.',
          status: 'Safe'
        },
        {
          id: 'seed-2',
          userId: 'demo-1',
          name: 'Natural Honey Jar',
          category: 'Condiments',
          quantity: '1 jar',
          expiryDate: getOffsetDate(3),
          warrantyDate: '',
          imageUrl: '',
          description: 'Pure wildflower honey, glass bottle.',
          status: 'Expiring Soon'
        },
        {
          id: 'seed-3',
          userId: 'demo-1',
          name: 'Eco Dishwasher Liquid',
          category: 'Cleaning',
          quantity: '2 bottles',
          expiryDate: getOffsetDate(-2),
          warrantyDate: '',
          imageUrl: '',
          description: 'Lemon scented environmental-friendly dishwash gel.',
          status: 'Expired'
        },
        {
          id: 'seed-4',
          userId: 'demo-1',
          name: 'Paracetamol 500mg',
          category: 'Medicine',
          quantity: '1 box',
          expiryDate: getOffsetDate(120),
          warrantyDate: getOffsetDate(180),
          imageUrl: '',
          description: 'Over-the-counter pain reliever and fever reducer.',
          status: 'Safe'
        },
        {
          id: 'seed-5',
          userId: 'demo-1',
          name: 'Fresh Whole Milk',
          category: 'Dairy',
          quantity: '1 Litre',
          expiryDate: getOffsetDate(1),
          warrantyDate: '',
          imageUrl: '',
          description: 'Pasteurized homogenized full-fat dairy milk.',
          status: 'Expiring Soon'
        }
      ];
    }
  };

// ==========================================
// Initialize authentication and session state.
// (Must run before inventory.js/features.js/dashboard.js use `products`)
// ==========================================
SessionModule.init();
AuthModule.init();
products = StorageModule.loadProducts();
