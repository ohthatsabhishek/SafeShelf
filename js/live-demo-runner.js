/**
 * SafeShelf Live Interactive Demo Runner
 * Runs directly inside the user's active browser window so they can watch the live demonstration.
 */
(function() {
  function createDemoUI() {
    if (document.getElementById('safeShelfDemoWidget')) return;

    const widget = document.createElement('div');
    widget.id = 'safeShelfDemoWidget';
    widget.style.position = 'fixed';
    widget.style.bottom = '24px';
    widget.style.right = '24px';
    widget.style.zIndex = '999999';
    widget.style.fontFamily = 'var(--font-sans, system-ui, sans-serif)';
    widget.innerHTML = `
      <div id="demoWidgetCard" style="background: rgba(28, 25, 23, 0.94); color: #F5F5F0; padding: 14px 20px; border-radius: 14px; box-shadow: 0 12px 32px rgba(0,0,0,0.4); border: 1px solid rgba(226, 160, 63, 0.5); backdrop-filter: blur(12px); max-width: 320px; transition: all 0.3s ease;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 8px; height: 8px; background: #E2A03F; border-radius: 50%; display: inline-block;"></span>
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #E2A03F;">SafeShelf Live Demo</span>
          </div>
          <button id="closeDemoWidgetBtn" style="background: none; border: none; color: #A8A29E; cursor: pointer; font-size: 14px;">✕</button>
        </div>
        <div id="demoStatusText" style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #FFF;">Ready to watch demo?</div>
        <div id="demoSubText" style="font-size: 12px; color: #D6D3D1; margin-bottom: 12px; line-height: 1.4;">Watch SafeShelf navigate views, add provisions, search the catalog, and update groceries live.</div>
        <div style="display: flex; gap: 8px;">
          <button id="startLiveDemoBtn" style="flex: 1; background: #E2A03F; color: #1C1917; border: none; border-radius: 8px; padding: 9px 14px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 12px rgba(226, 160, 63, 0.35);">
            ▶ Start Live Demo
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    document.getElementById('closeDemoWidgetBtn').addEventListener('click', () => {
      widget.style.display = 'none';
    });

    document.getElementById('startLiveDemoBtn').addEventListener('click', () => {
      runInteractiveDemo();
    });

    // Check if auto-start is requested via URL parameter ?demo=auto
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'auto') {
      setTimeout(runInteractiveDemo, 800);
    }
  }

  function setStatus(title, subtitle) {
    const statusText = document.getElementById('demoStatusText');
    const subText = document.getElementById('demoSubText');
    if (statusText) statusText.textContent = title;
    if (subText) subText.textContent = subtitle;
  }

  const delay = ms => new Promise(r => setTimeout(r, ms));

  async function typeInto(input, text) {
    input.focus();
    input.value = '';
    for (let char of text) {
      input.value += char;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await delay(40);
    }
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function runInteractiveDemo() {
    const startBtn = document.getElementById('startLiveDemoBtn');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.style.opacity = '0.6';
      startBtn.textContent = '⏳ Demo Running...';
    }

    try {
      // STEP 1: LOGIN (if not logged in)
      const token = localStorage.getItem('safeshelf_auth_token');
      const authVisible = document.getElementById('authContainer')?.offsetParent !== null;

      if (!token || authVisible) {
        setStatus('Step 1: Authenticating', 'Auto-filling demo credentials & verifying JWT session');
        const fillBtn = document.getElementById('fillDemoCredentialsBtn');
        if (fillBtn) {
          fillBtn.click();
          await delay(1200);
        } else {
          await typeInto(document.getElementById('loginEmail'), 'demo@safeshelf.com');
          await typeInto(document.getElementById('loginPassword'), 'password');
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
          loginForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          await delay(2000);
        }
      }

      // STEP 2: DASHBOARD
      setStatus('Step 2: Dashboard Overview', 'Real-time KPI metrics & urgent provisions monitoring');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await delay(1500);
      window.scrollBy({ top: 320, behavior: 'smooth' });
      await delay(2200);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await delay(1000);

      // STEP 3: INVENTORY NAVIGATION & ADD ITEM
      setStatus('Step 3: Inventory Management', 'Navigating to provisions catalog & opening slide drawer');
      const invNav = document.querySelector('.nav-item[data-view="inventory"]');
      if (invNav) invNav.click();
      await delay(1800);

      const addBtn = document.getElementById('openAddDrawerBtn');
      if (addBtn) addBtn.click();
      await delay(1400);

      const sampleItem = `Artisan Olive Oil ${Date.now().toString(36).slice(-4)}`;
      setStatus('Step 4: Adding New Provision', `Adding "${sampleItem}" with 500 ml quantity`);
      
      const nameInput = document.getElementById('productName');
      if (nameInput) await typeInto(nameInput, sampleItem);
      
      const catSelect = document.getElementById('productCategory');
      if (catSelect) {
        catSelect.value = 'Condiments';
        catSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      const qtyInput = document.getElementById('productQuantity');
      if (qtyInput) await typeInto(qtyInput, '500 ml');

      const expiryInput = document.getElementById('productExpiry');
      if (expiryInput) {
        expiryInput.value = '2027-02-20';
        expiryInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const descInput = document.getElementById('productDesc');
      if (descInput) await typeInto(descInput, 'Cold-pressed extra virgin olive oil from Tuscany');
      await delay(1200);

      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) submitBtn.click();
      await delay(2200);

      // STEP 4: CATALOG SEARCH
      setStatus('Step 5: Catalog Search Engine', 'Searching 112+ curated provisions for "honey"');
      if (addBtn) addBtn.click();
      await delay(1200);

      const searchInput = document.getElementById('apiSearchInput');
      if (searchInput) await typeInto(searchInput, 'honey');
      
      const searchBtn = document.getElementById('apiSearchBtn');
      if (searchBtn) searchBtn.click();
      await delay(2800);

      const cancelBtn = document.getElementById('cancelEditBtn');
      if (cancelBtn) cancelBtn.click();
      await delay(1200);

      // STEP 5: SHOPPING LIST OPERATIONS
      setStatus('Step 6: Shopping List Operations', 'Adding grocery item and toggling purchased state');
      const shopNav = document.querySelector('.nav-item[data-view="shopping"]');
      if (shopNav) shopNav.click();
      await delay(1800);

      const groceryInput = document.getElementById('quickShoppingInput');
      if (groceryInput) await typeInto(groceryInput, 'Organic Sourdough Bread');

      const groceryCat = document.getElementById('quickShoppingCategory');
      if (groceryCat) {
        groceryCat.value = 'Food Grains';
        groceryCat.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const quickAddForm = document.getElementById('quickAddShoppingForm');
      if (quickAddForm) {
        quickAddForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await delay(1500);
      }

      const checkboxes = document.querySelectorAll('#shoppingTableBody .shopping-checkbox');
      if (checkboxes.length > 0) {
        checkboxes[0].click();
        await delay(2000);
      }

      // STEP 6: PROFILE SETTINGS
      setStatus('Step 7: Household Settings', 'Exploring pantry profile and notification preferences');
      const profileNav = document.querySelector('.nav-item[data-view="profile"]');
      if (profileNav) profileNav.click();
      await delay(2500);

      // STEP 7: RETURN TO DASHBOARD & CLEANUP
      setStatus('Step 8: Return to Dashboard', 'Syncing states and concluding live demonstration');
      if (invNav) invNav.click();
      await delay(1000);

      // Clean up sample item
      const rows = document.querySelectorAll('#productTableBody tr');
      for (let r of rows) {
        if (r.textContent.includes(sampleItem)) {
          const delBtn = r.querySelector('.action-delete');
          if (delBtn) {
            delBtn.click();
            await delay(600);
            const confBtn = document.getElementById('confirmModalConfirmBtn');
            if (confBtn) confBtn.click();
            await delay(1000);
          }
          break;
        }
      }

      const dashNav = document.querySelector('.nav-item[data-view="dashboard"]');
      if (dashNav) dashNav.click();
      await delay(1000);

      setStatus('Demo Completed! 🎉', 'SafeShelf is responsive, verified, and running smoothly.');
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
        startBtn.textContent = '↻ Replay Demo';
      }

    } catch (err) {
      console.error('Demo error:', err);
      setStatus('Demo Paused', err.message);
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
        startBtn.textContent = '↻ Retry Demo';
      }
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createDemoUI);
  } else {
    createDemoUI();
  }
})();
