const { chromium } = require('playwright');
const path = require('path');

async function runLiveDemo() {
  console.log('====================================================');
  console.log('🎬 STARTING LIVE BROWSER DEMO: SAFESHELF');
  console.log('====================================================\n');

  const userDataDir = 'C:\\Users\\asus\\AppData\\Local\\Temp\\SafeShelfPlaywrightDemo';
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    slowMo: 140,
    viewport: null,
    args: [
      '--start-maximized',
      '--window-position=40,30',
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  async function setDemoBanner(text, subtext = '') {
    console.log(`\n📢 [DEMO STEP] ${text} ${subtext ? '(' + subtext + ')' : ''}`);
    await page.evaluate(({ text, subtext }) => {
      let banner = document.getElementById('demoBanner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'demoBanner';
        banner.style.position = 'fixed';
        banner.style.bottom = '28px';
        banner.style.right = '28px';
        banner.style.backgroundColor = 'rgba(28, 25, 23, 0.94)';
        banner.style.color = '#F5F5F0';
        banner.style.padding = '14px 22px';
        banner.style.borderRadius = '14px';
        banner.style.boxShadow = '0 12px 30px rgba(0,0,0,0.35)';
        banner.style.fontFamily = 'Plus Jakarta Sans, sans-serif';
        banner.style.fontSize = '14px';
        banner.style.fontWeight = '500';
        banner.style.zIndex = '999999';
        banner.style.border = '1px solid rgba(226, 160, 63, 0.4)';
        banner.style.backdropFilter = 'blur(10px)';
        banner.style.transition = 'all 0.3s ease';
        banner.style.pointerEvents = 'none';
        document.body.appendChild(banner);
      }
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="display: inline-block; width: 8px; height: 8px; background-color: #E2A03F; border-radius: 50%;"></span>
          <span style="color: #E2A03F; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">SafeShelf Live Demo</span>
        </div>
        <div style="font-size: 15px; font-weight: 600; color: #FFFFFF;">${text}</div>
        ${subtext ? `<div style="font-size: 12px; color: #D6D3D1; margin-top: 2px;">${subtext}</div>` : ''}
      `;
    }, { text, subtext });
  }

  try {
    // ----------------------------------------------------
    // 1. Open Homepage & Editorial Login
    // ----------------------------------------------------
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await setDemoBanner('Welcome to SafeShelf', 'Curated Household Pantry & Provisions Management');
    await page.waitForTimeout(2500);

    // ----------------------------------------------------
    // 2. Log In with Demo Account
    // ----------------------------------------------------
    await setDemoBanner('Authenticating Demo Household', 'Auto-filling credentials & verifying JWT session');
    await page.click('#fillDemoCredentialsBtn');
    await page.waitForTimeout(1200);

    await page.click('#loginForm button[type="submit"]');
    await page.waitForTimeout(2000);

    // ----------------------------------------------------
    // 3. Dashboard Overview & Features Explanation
    // ----------------------------------------------------
    await setDemoBanner('Dashboard Overview', 'Real-time KPI provisions tracking & urgent restock alerts');
    await page.waitForTimeout(1500);

    // Smooth scroll down to highlight recent provisions
    await page.evaluate(() => window.scrollBy({ top: 320, behavior: 'smooth' }));
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.scrollBy({ top: -320, behavior: 'smooth' }));
    await page.waitForTimeout(1200);

    // ----------------------------------------------------
    // 4. Navigate to Inventory & Add Sample Item
    // ----------------------------------------------------
    await setDemoBanner('Pantry Inventory Management', 'Navigating to full inventory catalog');
    await page.click('.nav-item[data-view="inventory"]');
    await page.waitForTimeout(1800);

    await setDemoBanner('Adding New Provision', 'Slide-over drawer with category & shelf-life suggestions');
    await page.click('#openAddDrawerBtn');
    await page.waitForTimeout(1500);

    // Fill form
    const sampleItem = `Artisan Olive Oil ${Date.now().toString(36).slice(-4)}`;
    await page.fill('#productName', sampleItem);
    await page.waitForTimeout(400);
    await page.selectOption('#productCategory', 'Condiments');
    await page.waitForTimeout(400);
    await page.fill('#productQuantity', '500 ml');
    await page.waitForTimeout(400);
    await page.fill('#productExpiry', '2027-02-15');
    await page.waitForTimeout(400);
    await page.fill('#productDesc', 'Cold-pressed extra virgin olive oil from Tuscany');
    await page.waitForTimeout(1200);

    await setDemoBanner('Saving to Database', `Saving "${sampleItem}" to MongoDB`);
    await page.click('#submitBtn');
    await page.waitForTimeout(2200);

    // ----------------------------------------------------
    // 5. Demonstrate Catalog Search Integration
    // ----------------------------------------------------
    await setDemoBanner('Catalog Search Engine', 'Querying 112+ curated items across pantry categories');
    await page.click('#openAddDrawerBtn');
    await page.waitForTimeout(1400);

    await page.fill('#apiSearchInput', 'honey');
    await page.waitForTimeout(400);
    await page.click('#apiSearchBtn');
    
    try {
      await page.waitForSelector('#apiResultsList li.picker-result-card', { timeout: 6000 });
    } catch (_) {}
    
    await setDemoBanner('Catalog Suggestions Ready', 'Instant autofill suggestions with shelf-life data');
    await page.waitForTimeout(3000);
    await page.click('#cancelEditBtn');
    await page.waitForTimeout(1200);

    // ----------------------------------------------------
    // 6. Demonstrate Shopping List Operations
    // ----------------------------------------------------
    await setDemoBanner('Curated Shopping List', 'Quick provisions re-order & grocery tracking');
    await page.click('.nav-item[data-view="shopping"]');
    await page.waitForTimeout(1800);

    const sampleGrocery = 'Organic Sourdough Bread';
    await page.fill('#quickShoppingInput', sampleGrocery);
    await page.selectOption('#quickShoppingCategory', 'Food Grains');
    await page.waitForTimeout(600);
    await page.click('#quickAddShoppingForm button[type="submit"]');
    await page.waitForTimeout(1500);

    // Toggle purchased status
    await setDemoBanner('Toggling Provision State', 'Marking grocery item as purchased/restocked');
    const shopRow = page.locator(`#shoppingTableBody tr:has-text("${sampleGrocery}")`).first();
    await shopRow.locator('.shopping-checkbox').click();
    await page.waitForTimeout(2500);

    // ----------------------------------------------------
    // 7. Profile / Household Settings View
    // ----------------------------------------------------
    await setDemoBanner('Household Profile & Settings', 'Manage pantry identity, notification channels & preferences');
    await page.click('.nav-item[data-view="profile"]');
    await page.waitForTimeout(3000);

    // ----------------------------------------------------
    // 8. Return to Dashboard & Wrap Up
    // ----------------------------------------------------
    await setDemoBanner('Returning to Dashboard', 'All provisions, updates, and shopping states synced');
    await page.click('.nav-item[data-view="dashboard"]');
    await page.waitForTimeout(2000);

    // Clean up sample item from inventory to preserve database cleanliness
    await page.click('.nav-item[data-view="inventory"]');
    await page.waitForTimeout(1000);
    const itemToDelete = page.locator(`#productTableBody tr:has-text("${sampleItem}")`);
    if (await itemToDelete.count() > 0) {
      await itemToDelete.first().locator('.action-delete').click();
      await page.waitForTimeout(600);
      await page.click('#confirmModalConfirmBtn');
      await page.waitForTimeout(1200);
    }
    
    // Return to dashboard
    await page.click('.nav-item[data-view="dashboard"]');
    await page.waitForTimeout(1000);

    await setDemoBanner('Live Demo Completed! 🎉', 'SafeShelf is verified, responsive, and ready');
    await page.waitForTimeout(4000);

    console.log('\n✔ Live demo completed successfully without any errors.');

  } catch (err) {
    console.error('\n💥 Demo interrupted or encountered error:', err);
  } finally {
    console.log('\n🌟 Demo completed. Keeping the browser window open for you to view and interact with!');
    // Keep browser open indefinitely so user can explore
    await new Promise(resolve => setTimeout(resolve, 3600000));
  }
}

runLiveDemo().catch(console.error);
