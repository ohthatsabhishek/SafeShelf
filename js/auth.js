/**
 * SAFESHELF — auth.js
 * ------------------------------------------------------------
 * MEMBER 1 MODULE: Authentication, Session & Data Persistence
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
// SHARED EMAIL VALIDATION HELPER
// ------------------------------------------------------------
// Used by AuthModule (login/register) and ProfileForm wherever an
// email needs to be checked before a form is submitted/saved.
// We deliberately do NOT rely only on <input type="email">, since
// native browser validation is inconsistent and easy to bypass
// (e.g. via autofill, programmatic value changes, or older browsers).
// ==========================================
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const value = email.trim();
  // RFC-5322 "good enough" practical email pattern: local@domain.tld
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return EMAIL_REGEX.test(value);
}

// ==========================================
// SHARED NOTIFICATION POPUP (replaces alert())
// ------------------------------------------------------------
// One reusable function used by every file instead of the
// browser's alert() box. It shows a small message inside the
// page (bottom-right corner) that fades away on its own.
// type can be: 'success', 'error', 'warning', or 'info'
// ==========================================
function showNotification(message, type = 'info') {
  // Find (or create) the box that holds all notification messages
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }

  // Pick the CSS class that matches the message type
  let typeClass = 'notification-info';
  if (type === 'success') typeClass = 'notification-success';
  else if (type === 'error') typeClass = 'notification-error';
  else if (type === 'warning') typeClass = 'notification-warning';

  // Build and show the notification box
  const note = document.createElement('div');
  note.className = 'notification-box ' + typeClass;
  note.textContent = message;
  container.appendChild(note);

  // Fade it in (small delay so the CSS transition can play)
  setTimeout(() => note.classList.add('notification-show'), 10);

  // Fade it out and remove it after a few seconds
  setTimeout(() => {
    note.classList.remove('notification-show');
    setTimeout(() => note.remove(), 300);
  }, 3000);
}

// ==========================================
// SHARED CONFIRMATION MODAL (replaces confirm())
// ------------------------------------------------------------
// One reusable function used by every file instead of the
// browser's confirm() box. It fills in the title/message/button
// text on the #confirmModal markup (see index.html) and shows it.
// The action passed in as `onConfirm` only runs if the user
// clicks the confirm button.
// ==========================================
function showConfirm(title, message, onConfirm, confirmButtonText) {
  const modal = document.getElementById('confirmModal');
  const confirmBtn = document.getElementById('confirmModalConfirmBtn');
  if (!modal || !confirmBtn) return;

  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalMessage').textContent = message;
  confirmBtn.textContent = confirmButtonText || 'Confirm';

  // Replace the button's click action with this action's own logic.
  // Setting .onclick (instead of addEventListener) means each call
  // simply overwrites the previous handler, so clicks never stack up.
  confirmBtn.onclick = function () {
    modal.classList.remove('show');
    if (onConfirm) onConfirm();
  };

  modal.classList.add('show');
}

// Wire up the Cancel button once. It just hides the modal without
// running the confirm action.
const confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');
if (confirmModalCancelBtn) {
  confirmModalCancelBtn.addEventListener('click', () => {
    document.getElementById('confirmModal').classList.remove('show');
  });
}

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
    this.currentUser = this.getCurrentUser();

    const appContainer = document.getElementById('appContainer');
    const authContainer = document.getElementById('authContainer');

    if (this.currentUser) {
      if (authContainer) authContainer.style.display = 'none';
      if (appContainer) appContainer.style.display = 'flex';
      this.updateUserUI();
    } else {
      if (authContainer) authContainer.style.display = 'flex';
      if (appContainer) appContainer.style.display = 'none';
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

      greetingEl.textContent = `${timeGreeting}, ${this.currentUser.name.split(' ')[0]}`;
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
        firstLi.replaceChildren();
        const nameEl = document.createElement('div');
        nameEl.style.fontWeight = '600';
        nameEl.textContent = this.currentUser.name;
        const emailEl = document.createElement('div');
        emailEl.style.cssText = 'font-size: 11px; color: var(--text-muted); margin-top: 4px;';
        emailEl.textContent = this.currentUser.email;
        firstLi.append(nameEl, emailEl);
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
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!email || !isValidEmail(email)) { loginError.textContent = 'Please enter a valid email address.'; return; }
        loginError.textContent = 'Signing in…';
        try {
          const response = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Login failed.');
          localStorage.setItem('safeshelf_auth_token', data.token);
          const sessionUser = { id:data.user.id, name:data.user.name, email:data.user.email, role:data.user.role, notificationsEnabled:true, reminderDays:7 };
          localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(sessionUser));
          this.currentUser = sessionUser;
          await StorageModule.syncFromServer();
          location.reload();
        } catch (error) { loginError.textContent = error.message || 'Unable to connect to the server.'; }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirm').value;
        if (name.length < 2) return registerError.textContent = 'Name must contain at least 2 characters.';
        if (!isValidEmail(email)) return registerError.textContent = 'Please enter a valid email address.';
        if (password.length < 8) return registerError.textContent = 'Password must contain at least 8 characters.';
        if (password !== confirmPassword) return registerError.textContent = 'Passwords do not match.';
        registerError.textContent = 'Creating account…';
        try {
          const response = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,email,password}) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Registration failed.');
          registerForm.style.display = 'none'; loginForm.style.display = 'block';
          registerError.textContent = ''; loginError.textContent = 'Account created. Please sign in.'; loginError.style.color = 'var(--primary)';
          document.getElementById('loginEmail').value = email;
        } catch (error) { registerError.textContent = error.message || 'Unable to connect to the server.'; }
      });
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('profileName').value.trim();
        const newEmail = document.getElementById('profileEmail').value.trim();
        const profileMessage = document.getElementById('profileMessage');

        if (!newName) {
          profileMessage.style.color = 'var(--danger)';
          return profileMessage.textContent = 'Full Name is required.';
        }

        if (!newEmail) {
          profileMessage.style.color = 'var(--danger)';
          return profileMessage.textContent = 'Email address is required.';
        }

        if (!isValidEmail(newEmail)) {
          profileMessage.style.color = 'var(--danger)';
          return profileMessage.textContent = 'Please enter a valid email address (e.g. name@example.com).';
        }

        profileMessage.style.color = 'var(--text-secondary)';
        profileMessage.textContent = 'Saving profile changes…';

        const token = localStorage.getItem('safeshelf_auth_token');
        if (token) {
          try {
            const resp = await fetch('/api/auth/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ name: newName, email: newEmail })
            });
            const data = await resp.json();
            if (!resp.ok) {
              profileMessage.style.color = 'var(--danger)';
              profileMessage.textContent = data.error || 'Failed to update profile on server.';
              return;
            }
          } catch (err) {
            console.warn('Server profile update skipped, updating locally:', err.message);
          }
        }

        const users = this.getUsers();
        const isDuplicateEmail = users.some(u => u.email.toLowerCase() === newEmail.toLowerCase() && u.id !== this.currentUser.id);
        if (isDuplicateEmail) {
          profileMessage.style.color = 'var(--danger)';
          return profileMessage.textContent = 'This email address is already in use by another account.';
        }

        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
          users[userIndex].name = newName;
          users[userIndex].email = newEmail;
          localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        }

        this.currentUser.name = newName;
        this.currentUser.email = newEmail;
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this.currentUser));

        this.updateUserUI();

        const profilePageName = document.getElementById('profilePageName');
        if (profilePageName) profilePageName.textContent = newName;
        const profilePageEmail = document.getElementById('profilePageEmail');
        if (profilePageEmail) profilePageEmail.textContent = newEmail;
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

  async logout(options = {}) {
    // Safely sync any pending local changes before session ends if authenticated
    const token = localStorage.getItem('safeshelf_auth_token');
    if (token && typeof StorageModule !== 'undefined' && !options.skipSync) {
      try {
        const inventory = StorageModule.loadProducts();
        const shoppingList = StorageModule.loadShoppingList();
        const result = await StorageModule.syncToServer(inventory, shoppingList);
        if (result && !result.ok && !options.force && (inventory.length > 0 || shoppingList.length > 0)) {
          if (typeof showConfirm === 'function') {
            showConfirm(
              'Unsynced Changes',
              `Cloud synchronization could not be confirmed (${result.reason || 'server unreachable'}). Logging out will clear local data from this browser. Sign out anyway?`,
              () => this.logout({ skipSync: true, force: true }),
              'Sign Out Anyway'
            );
            return;
          }
        }
      } catch (e) {
        console.warn('Pending sync before logout could not be completed:', e.message);
      }
    }

    // Clear session tokens and user identity
    localStorage.removeItem(this.CURRENT_USER_KEY);
    localStorage.removeItem('safeshelf_auth_token');

    // Clear user-specific cached data to prevent data leakage on shared devices
    localStorage.removeItem('safeshelf_inventory_data');
    localStorage.removeItem('safeshelf_shopping_list');
    localStorage.removeItem('safeshelf_shopping_suppressed');
    localStorage.removeItem('safeshelf_dismissed_notifications');
    localStorage.removeItem('safeshelf_data_version');

    if (typeof SessionModule !== 'undefined' && SessionModule.clear) {
      SessionModule.clear();
    }

    location.reload();
  }
};

  const StorageModule = {
    STORAGE_KEY: 'safeshelf_inventory_data',
    SHOPPING_LIST_KEY: 'safeshelf_shopping_list',
    VERSION_KEY: 'safeshelf_data_version',

    syncState: 'idle', // 'idle' | 'pending' | 'saved' | 'offline' | 'failed' | 'conflict'
    isSyncing: false,
    pendingSync: null,

    getVersion() {
      const uid = AuthModule.currentUser && AuthModule.currentUser.id;
      if (!uid) return 0;
      try {
        const raw = localStorage.getItem(this.VERSION_KEY);
        if (!raw) return 0;
        const parsed = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null ? (Number(parsed[uid]) || 0) : 0;
      } catch (_) { return 0; }
    },

    setVersion(v) {
      const uid = AuthModule.currentUser && AuthModule.currentUser.id;
      if (!uid) return;
      try {
        let map = {};
        const raw = localStorage.getItem(this.VERSION_KEY);
        if (raw) map = JSON.parse(raw) || {};
        map[uid] = Number(v) || 0;
        localStorage.setItem(this.VERSION_KEY, JSON.stringify(map));
      } catch (_) {}
    },

    updateSyncUI(status, detail) {
      this.syncState = status;
      let badge = document.getElementById('cloudSyncStatus');
      if (!badge) {
        const actions = document.querySelector('.header-actions');
        if (actions) {
          badge = document.createElement('div');
          badge.id = 'cloudSyncStatus';
          badge.className = 'cloud-sync-status';
          actions.insertBefore(badge, actions.firstChild);
        }
      }
      if (!badge) return;

      if (!AuthModule.currentUser) {
        badge.style.display = 'none';
        return;
      }

      badge.style.display = 'inline-flex';
      badge.className = 'cloud-sync-status cloud-sync-' + status;

      switch (status) {
        case 'pending':
          badge.textContent = '☁️ Syncing…';
          badge.title = 'Saving changes to cloud…';
          break;
        case 'saved':
          badge.textContent = '☁️ Synced';
          badge.title = detail ? `Synced at ${detail}` : 'All changes saved to cloud';
          break;
        case 'offline':
          badge.textContent = '☁️ Offline';
          badge.title = 'Saved locally; cloud sync is offline (MongoDB disconnected)';
          break;
        case 'conflict':
          badge.textContent = '⚠️ Conflict';
          badge.title = 'Sync conflict: another session has newer cloud data. Click to resolve.';
          badge.onclick = () => {
            showNotification('Sync conflict: another session updated cloud data. Please reload to sync.', 'warning');
          };
          break;
        case 'failed':
          badge.textContent = '⚠️ Sync error';
          badge.title = detail || 'Cloud save failed; changes preserved locally';
          break;
        default:
          badge.style.display = 'none';
      }
    },

    handleConflict(conflictPayload, serverVersion) {
      const serverData = conflictPayload && conflictPayload.serverData;
      const message = 'Another session or tab has saved newer changes to the cloud.\n\n' +
        'Choose "Load Cloud" to update this device with the newer cloud data.\n' +
        'Choose "Cancel" to keep your local edits offline on this device without overwriting the cloud.';

      if (typeof showConfirm === 'function') {
        showConfirm(
          'Cloud Sync Conflict',
          message,
          () => {
            const uid = AuthModule.currentUser && AuthModule.currentUser.id;
            if (!uid) return;

            if (serverData) {
              const allProducts = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]').filter(p => p.userId !== uid);
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...allProducts, ...(serverData.inventory || []).map(p => ({ ...p, userId: uid }))]));

              const stored = JSON.parse(localStorage.getItem(this.SHOPPING_LIST_KEY) || '{}');
              const raw = {};
              if (Array.isArray(stored)) stored.forEach(entry => { if (entry && entry.userId) raw[entry.userId] = entry.items || []; });
              else Object.assign(raw, stored);
              raw[uid] = serverData.shoppingList || [];
              localStorage.setItem(this.SHOPPING_LIST_KEY, JSON.stringify(raw));
            }

            this.setVersion(serverVersion);
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.updateSyncUI('saved', timeStr);

            products = this.loadProducts();
            if (typeof DashboardModule !== 'undefined') {
              DashboardModule.updateDashboardMetrics(products);
            }
            if (typeof InventoryModule !== 'undefined') {
              InventoryModule.renderProductTable(products);
            }
            if (typeof ShoppingListModule !== 'undefined' && ShoppingListModule.renderShoppingList) {
              ShoppingListModule.renderShoppingList();
            }
            showNotification('Updated with latest cloud changes.', 'info');
          },
          'Load Cloud'
        );
      } else {
        showNotification('Sync conflict: newer data exists in the cloud. Local edits kept offline.', 'warning');
      }
    },

    // Safe numeric quantity extractor (e.g. "2 kg" -> 2, "1 jar" -> 1, "0" -> 0)
    getNumericQuantity(quantityStr) {
      if (typeof quantityStr === 'number') return Number.isFinite(quantityStr) && quantityStr >= 0 ? quantityStr : null;
      if (typeof quantityStr !== 'string' || !quantityStr.trim()) return null;
      const match = quantityStr.trim().match(/^([0-9]+(?:\.[0-9]+)?)(?=\s|$|[a-zA-Z])/);
      return match ? Number.parseFloat(match[1]) : null;
    },

    // Stock state helpers
    isOutOfStock(quantityStr) {
      const qty = this.getNumericQuantity(quantityStr);
      return qty !== null && qty <= 0;
    },

    isLowStock(quantityStr, threshold = 1) {
      const qty = this.getNumericQuantity(quantityStr);
      return qty !== null && qty > 0 && qty <= threshold;
    },

    async syncFromServer() {
      const token = localStorage.getItem('safeshelf_auth_token');
      if (!token) return false;
      try {
        const response = await fetch('/api/user-data', { headers: { Authorization: `Bearer ${token}` } });
        if (response.status === 401) {
          // Token expired or invalid
          AuthModule.logout({ skipSync: true });
          return false;
        }
        if (response.status === 503) {
          this.updateSyncUI('offline', 'MongoDB disconnected');
          return false;
        }
        if (!response.ok) {
          this.updateSyncUI('failed', `Server error (${response.status})`);
          return false;
        }
        const data = await response.json();
        const uid = AuthModule.currentUser && AuthModule.currentUser.id;
        if (!uid) return false;

        this.setVersion(Number(data.version) || 0);

        const allProducts = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]').filter(p => p.userId !== uid);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...allProducts, ...(data.inventory || []).map(p => ({...p,userId:uid}))]));
        const stored = JSON.parse(localStorage.getItem(this.SHOPPING_LIST_KEY) || '{}');
        const raw = {};
        if (Array.isArray(stored)) stored.forEach(entry => { if (entry && entry.userId) raw[entry.userId] = entry.items || []; });
        else Object.assign(raw, stored);
        raw[uid] = data.shoppingList || [];
        localStorage.setItem(this.SHOPPING_LIST_KEY, JSON.stringify(raw));

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.updateSyncUI('saved', timeStr);
        return true;
      } catch (e) {
        console.warn('Could not sync SafeShelf data from server:', e.message);
        this.updateSyncUI('offline', 'Network error');
        return false;
      }
    },

    async syncToServer(inventory, shoppingList) {
      const token = localStorage.getItem('safeshelf_auth_token');
      if (!token || !AuthModule.currentUser) {
        return { ok: false, status: 'unauthenticated', reason: 'Not signed in' };
      }

      // If another sync is currently in-flight, queue the latest payload to avoid duplicate in-flight requests
      if (this.isSyncing) {
        // A queued payload has not reached the server yet. Never report it as
        // saved: callers such as logout must treat it as pending until a later
        // request receives an explicit successful response.
        this.pendingSync = { inventory, shoppingList };
        return { ok: false, status: 'queued', reason: 'A cloud save is already in progress; this update is queued but not yet confirmed' };
      }

      this.isSyncing = true;
      this.updateSyncUI('pending');

      try {
        const version = this.getVersion();
        const response = await fetch('/api/user-data', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ inventory, shoppingList, version })
        });

        if (response.status === 401) {
          this.isSyncing = false;
          this.pendingSync = null;
          this.updateSyncUI('failed', 'Session expired');
          AuthModule.logout({ skipSync: true });
          return { ok: false, status: 'expired', reason: 'Session expired' };
        }

        if (response.status === 409) {
          this.isSyncing = false;
          this.pendingSync = null;
          const conflictPayload = await response.json().catch(() => ({}));
          const serverVersion = conflictPayload.currentVersion !== undefined ? conflictPayload.currentVersion : (version + 1);
          this.updateSyncUI('conflict', 'Conflict: newer cloud data');
          this.handleConflict(conflictPayload, serverVersion);
          return { ok: false, status: 'conflict', reason: 'Version conflict', serverData: conflictPayload.serverData };
        }

        if (response.status === 503) {
          this.isSyncing = false;
          this.pendingSync = null;
          this.updateSyncUI('offline', 'MongoDB offline');
          return { ok: false, status: 'offline', reason: 'Cloud service offline (MongoDB disconnected)' };
        }

        if (!response.ok) {
          this.isSyncing = false;
          this.pendingSync = null;
          const errPayload = await response.json().catch(() => ({}));
          const reason = errPayload.error || `Server returned ${response.status}`;
          this.updateSyncUI('failed', reason);
          return { ok: false, status: 'failed', reason };
        }

        const result = await response.json();
        if (result.version !== undefined) {
          this.setVersion(result.version);
        }
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.updateSyncUI('saved', timeStr);
        this.isSyncing = false;

        // Process any queued payload that arrived while sync was transmitting
        if (this.pendingSync) {
          const next = this.pendingSync;
          this.pendingSync = null;
          return this.syncToServer(next.inventory, next.shoppingList);
        }

        return { ok: true, status: 'saved', version: result.version };
      } catch (err) {
        this.isSyncing = false;
        this.pendingSync = null;
        this.updateSyncUI('offline', 'Network error');
        return { ok: false, status: 'offline', reason: err.message || 'Network error' };
      }
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
    async saveShoppingList(userId, items) {
      try {
        const uid = userId || (AuthModule.currentUser ? AuthModule.currentUser.id : null);
        if (!uid) return { ok: true, status: 'local', reason: 'Unauthenticated' };
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
        const inventory = this.loadProducts();
        return await this.syncToServer(inventory, items || []);
      } catch (e) {
        console.error('Error saving shopping list to localStorage', e);
        return { ok: false, status: 'error', reason: e.message };
      }
    },

    // Load data from localStorage
    loadProducts() {
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        let allProducts = data ? JSON.parse(data) : this.getSeedData();
        if (AuthModule.currentUser) {
          return allProducts.filter(p => p.userId === AuthModule.currentUser.id);
        }
        return [];
      } catch (e) {
        console.error('Error loading data from localStorage', e);
        return [];
      }
    },

    // Save data to localStorage
    async saveProducts(productsList) {
      if (!AuthModule.currentUser) return { ok: true, status: 'local', reason: 'Unauthenticated' };
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        let allProducts = data ? JSON.parse(data) : this.getSeedData();
        
        // Remove current user's old products
        allProducts = allProducts.filter(p => p.userId !== AuthModule.currentUser.id);
        
        // Add updated products
        allProducts = [...allProducts, ...productsList];
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allProducts));
        return await this.syncToServer(productsList, this.loadShoppingList());
      } catch (e) {
        console.error('Error saving data to localStorage', e);
        return { ok: false, status: 'error', reason: e.message };
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
        // Format from local calendar fields to avoid UTC conversion shifting the date.
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        d.setDate(d.getDate() + days);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
          imageUrl: './images/rice.jpeg',
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
// INITIALIZE MEMBER 1's MODULES
// (Must run before inventory.js/features.js/dashboard.js use `products`)
// ==========================================
SessionModule.init();
AuthModule.init();
products = StorageModule.loadProducts();
