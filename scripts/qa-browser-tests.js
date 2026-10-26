const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runBrowserQA() {
  console.log('====================================================');
  console.log('🚀 STARTING REAL INTERACTIVE CHROME QA TEST SUITE');
  console.log('====================================================\n');

  const testResults = [];
  const consoleErrors = [];
  const failedRequests = [];

  const uniqueId = Date.now().toString(36);
  const testItemName = `QA Basmati ${uniqueId}`;
  const testShopName = `QA Almond Milk ${uniqueId}`;
  const testCsvItemName = `QA Sourdough ${uniqueId}`;

  // Ensure screenshots directories exist
  const projectScreenshotsDir = path.join(__dirname, '..', 'screenshots');
  const artifactScreenshotsDir = 'C:\\Users\\asus\\.gemini\\antigravity-ide\\brain\\e43efe50-d14f-47d4-b919-d19b4bc5a8de\\screenshots';
  
  if (!fs.existsSync(projectScreenshotsDir)) fs.mkdirSync(projectScreenshotsDir, { recursive: true });
  try {
    if (!fs.existsSync(artifactScreenshotsDir)) fs.mkdirSync(artifactScreenshotsDir, { recursive: true });
  } catch (_) {}

  async function takeScreenshot(page, filename, label) {
    const localPath = path.join(projectScreenshotsDir, filename);
    await page.screenshot({ path: localPath, fullPage: false });
    try {
      const artPath = path.join(artifactScreenshotsDir, filename);
      fs.copyFileSync(localPath, artPath);
    } catch (_) {}
    console.log(`  📸 Captured screenshot: ${filename} (${label})`);
  }

  // Launch REAL Google Chrome in HEADED (visible) mode
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    slowMo: 180,
    args: [
      '--start-maximized',
      '--window-position=80,60',
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });

  const page = await context.newPage();

  // Monitor console errors and network failures
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', req => {
    failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });

  try {
    // ----------------------------------------------------
    // TEST 1: Homepage & Authentication View
    // ----------------------------------------------------
    console.log('▶ Test 1: Loading Homepage & Verifying Login Screen...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const pageTitle = await page.title();
    const authVisible = await page.isVisible('#authContainer');
    const loginFormVisible = await page.isVisible('#loginForm');
    
    await takeScreenshot(page, '01_login_screen.png', 'Editorial Login Screen');

    if (authVisible && loginFormVisible && pageTitle.includes('SafeShelf')) {
      testResults.push({ name: 'Homepage & Auth View', status: 'PASS', details: `Title: ${pageTitle}`, screenshot: '01_login_screen.png' });
      console.log('  ✔ PASS: Homepage loaded with editorial login form.');
    } else {
      testResults.push({ name: 'Homepage & Auth View', status: 'FAIL', details: 'Login form not visible', screenshot: '01_login_screen.png' });
      console.log('  ✖ FAIL: Login form not visible.');
    }

    // ----------------------------------------------------
    // TEST 2: Demo Account Auto-Fill & Login
    // ----------------------------------------------------
    console.log('\n▶ Test 2: Testing Demo Credentials Auto-Fill & Sign-In...');
    await page.click('#fillDemoCredentialsBtn');
    const emailVal = await page.inputValue('#loginEmail');
    const passVal = await page.inputValue('#loginPassword');

    if (emailVal === 'demo@safeshelf.com' && passVal === 'password') {
      console.log('  ✔ PASS: Demo credentials successfully auto-filled.');
    } else {
      throw new Error(`Demo fill failed: email=${emailVal}`);
    }

    // Submit login form and wait for dashboard render
    await page.click('#loginForm button[type="submit"]');
    await page.waitForTimeout(1600);

    const appVisible = await page.isVisible('#appContainer');
    const greetingText = await page.textContent('#dashboardGreeting');
    
    if (appVisible && greetingText.includes('Demo')) {
      testResults.push({ name: 'Authentication & Sign-In', status: 'PASS', details: `Greeting: "${greetingText.trim()}"` });
      console.log(`  ✔ PASS: Successfully authenticated. Greeting: "${greetingText.trim()}"`);
    } else {
      testResults.push({ name: 'Authentication & Sign-In', status: 'FAIL', details: `App visible: ${appVisible}, greeting: ${greetingText}` });
      console.log('  ✖ FAIL: Authentication failed or dashboard not visible.');
    }

    // ----------------------------------------------------
    // TEST 3: Dashboard Metrics & Overview
    // ----------------------------------------------------
    console.log('\n▶ Test 3: Verifying Dashboard Metrics & Inventory Summary...');
    const totalCount = await page.textContent('#metricTotal');
    const expiringCount = await page.textContent('#metricExpiring');
    console.log(`  📊 Metrics displayed: Total Provisions = ${totalCount.trim()}, Expiring Soon = ${expiringCount.trim()}`);
    
    const recentRows = await page.$$('#recentTableBody tr');
    await takeScreenshot(page, '02_dashboard_overview.png', 'Authenticated Dashboard with Metrics');

    if (recentRows.length > 0) {
      testResults.push({ name: 'Dashboard Metrics & Recent Items', status: 'PASS', details: `${recentRows.length} recent table rows rendered`, screenshot: '02_dashboard_overview.png' });
      console.log(`  ✔ PASS: Dashboard metrics active with ${recentRows.length} recent rows.`);
    } else {
      testResults.push({ name: 'Dashboard Metrics & Recent Items', status: 'FAIL', details: 'No rows in recent table', screenshot: '02_dashboard_overview.png' });
      console.log('  ✖ FAIL: Recent items table empty.');
    }

    // ----------------------------------------------------
    // TEST 4: Navigation to Inventory View
    // ----------------------------------------------------
    console.log('\n▶ Test 4: Testing Navigation to Inventory View...');
    await page.click('.nav-item[data-view="inventory"]');
    await page.waitForTimeout(400);
    const inventoryVisible = await page.isVisible('#inventoryView');
    const tableVisible = await page.isVisible('#productTableWrapper');

    await takeScreenshot(page, '03_inventory_view.png', 'Inventory Catalog View');

    if (inventoryVisible && tableVisible) {
      testResults.push({ name: 'Inventory View Navigation', status: 'PASS', details: 'Inventory view and table rendered', screenshot: '03_inventory_view.png' });
      console.log('  ✔ PASS: Navigated to Inventory view successfully.');
    } else {
      testResults.push({ name: 'Inventory View Navigation', status: 'FAIL', details: 'Inventory view not visible', screenshot: '03_inventory_view.png' });
      console.log('  ✖ FAIL: Inventory view failed to render.');
    }

    // ----------------------------------------------------
    // TEST 5: Slide-Over Drawer & Multer Image Upload
    // ----------------------------------------------------
    console.log(`\n▶ Test 5: Adding New Product ("${testItemName}") with Multer Photo Upload...`);
    await page.click('#openAddDrawerBtn');
    await page.waitForTimeout(500);
    const drawerOpen = await page.evaluate(() => document.getElementById('inventoryDrawerBackdrop').classList.contains('show'));
    
    if (!drawerOpen) throw new Error('Drawer did not open');
    console.log('  ✔ Drawer opened successfully.');

    // Create a temporary test photo for Multer upload
    const testPhotoPath = path.join(__dirname, 'test_qa_upload.png');
    const testPngBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');
    fs.writeFileSync(testPhotoPath, testPngBuffer);

    // Upload via Multer input
    const fileInput = await page.$('#productImage');
    await fileInput.setInputFiles(testPhotoPath);
    await page.waitForTimeout(1000); // wait for upload to complete

    const uploadedUrl = await page.inputValue('#productImageUrl');
    const previewVisible = await page.isVisible('#productImagePreview');
    console.log(`  ✔ Multer photo uploaded: url = "${uploadedUrl}", preview visible = ${previewVisible}`);

    try { fs.unlinkSync(testPhotoPath); } catch (_) {}

    // Fill the rest of the form
    await page.fill('#productName', testItemName);
    await page.selectOption('#productCategory', 'Food Grains');
    await page.fill('#productQuantity', '5 kg');
    await page.fill('#productExpiry', '2026-12-25');
    await page.fill('#productDesc', 'Autonomous QA test product with Multer photo');

    await takeScreenshot(page, '04_drawer_multer_upload.png', 'Product Form with Multer Image Preview');

    // Submit form
    await page.click('#submitBtn');
    await page.waitForTimeout(900);

    // Verify item is added to inventory table
    const tableText = await page.textContent('#productTableBody');
    if (tableText.includes(testItemName) && uploadedUrl.startsWith('/uploads/')) {
      testResults.push({ name: 'Product Creation & Multer Upload', status: 'PASS', details: `Uploaded URL: ${uploadedUrl}`, screenshot: '04_drawer_multer_upload.png' });
      console.log(`  ✔ PASS: "${testItemName}" created with Multer image upload.`);
    } else {
      testResults.push({ name: 'Product Creation & Multer Upload', status: 'FAIL', details: 'Item not found in table', screenshot: '04_drawer_multer_upload.png' });
      console.log('  ✖ FAIL: Product not found in table.');
    }

    // ----------------------------------------------------
    // TEST 6: Product Details Modal
    // ----------------------------------------------------
    console.log('\n▶ Test 6: Verifying Product Specification Modal...');
    const row = page.locator(`#productTableBody tr:has-text("${testItemName}")`);
    await row.locator('.action-view').click();
    await page.waitForTimeout(500);

    const modalVisible = await page.evaluate(() => document.getElementById('detailsModal').classList.contains('show'));
    const modalBodyText = await page.textContent('#detailsModalBody');
    
    await takeScreenshot(page, '05_product_modal.png', 'Product Specification Modal');

    if (modalVisible && modalBodyText.includes(testItemName) && modalBodyText.includes('5 kg')) {
      testResults.push({ name: 'Product Specification Modal', status: 'PASS', details: 'Modal showed product specs', screenshot: '05_product_modal.png' });
      console.log('  ✔ PASS: Specification modal correctly displays item details.');
    } else {
      testResults.push({ name: 'Product Specification Modal', status: 'FAIL', details: 'Modal did not show correct details', screenshot: '05_product_modal.png' });
      console.log('  ✖ FAIL: Details modal error.');
    }

    // Close modal
    await page.click('#closeModal');
    await page.waitForTimeout(300);

    // ----------------------------------------------------
    // TEST 7: Edit Product
    // ----------------------------------------------------
    console.log('\n▶ Test 7: Testing Product Edit...');
    await row.locator('.action-edit').click();
    await page.waitForTimeout(500);

    const formTitle = await page.textContent('#formTitle');
    const existingQty = await page.inputValue('#productQuantity');
    console.log(`  ✔ Edit mode opened: title = "${formTitle}", quantity = "${existingQty}"`);

    // Change quantity to 10 kg
    await page.fill('#productQuantity', '10 kg');
    await page.click('#submitBtn');
    await page.waitForTimeout(800);

    const updatedRowText = await page.locator(`#productTableBody tr:has-text("${testItemName}")`).textContent();
    await takeScreenshot(page, '06_product_edited.png', 'Updated Inventory Item');

    if (updatedRowText.includes('10 kg')) {
      testResults.push({ name: 'Product Edit & Quantity Update', status: 'PASS', details: 'Quantity updated to 10 kg', screenshot: '06_product_edited.png' });
      console.log('  ✔ PASS: Quantity successfully updated to 10 kg.');
    } else {
      testResults.push({ name: 'Product Edit & Quantity Update', status: 'FAIL', details: 'Quantity did not update', screenshot: '06_product_edited.png' });
      console.log('  ✖ FAIL: Quantity did not update.');
    }

    // ----------------------------------------------------
    // TEST 8: Catalog Search Integration (/api/products)
    // ----------------------------------------------------
    console.log('\n▶ Test 8: Testing Catalog Search Integration...');
    await page.click('#openAddDrawerBtn');
    await page.waitForTimeout(500);

    await page.fill('#apiSearchInput', 'honey');
    await page.click('#apiSearchBtn');
    try {
      await page.waitForSelector('#apiResultsList li.picker-result-card', { timeout: 6000 });
    } catch (_) {}

    const searchResults = await page.$$('#apiResultsList li.picker-result-card');
    console.log(`  ✔ Catalog search returned ${searchResults.length} suggestion cards.`);
    
    await takeScreenshot(page, '07_catalog_search.png', 'Catalog Search with MongoDB & API results');

    if (searchResults.length > 0) {
      testResults.push({ name: 'Catalog Search Integration', status: 'PASS', details: `${searchResults.length} products found for query "honey"`, screenshot: '07_catalog_search.png' });
      console.log('  ✔ PASS: Catalog search fetched products successfully.');
    } else {
      testResults.push({ name: 'Catalog Search Integration', status: 'FAIL', details: 'No search results', screenshot: '07_catalog_search.png' });
      console.log('  ✖ FAIL: Catalog search returned 0 items.');
    }
    await page.click('#cancelEditBtn');
    await page.waitForTimeout(300);

    // ----------------------------------------------------
    // TEST 9: Shopping List Operations
    // ----------------------------------------------------
    console.log(`\n▶ Test 9: Testing Shopping List View & Quick Add ("${testShopName}")...`);
    await page.click('.nav-item[data-view="shopping"]');
    await page.waitForTimeout(500);

    await page.fill('#quickShoppingInput', testShopName);
    await page.selectOption('#quickShoppingCategory', 'Dairy');
    await page.click('#quickAddShoppingForm button[type="submit"]');
    await page.waitForTimeout(600);

    const shoppingTableText = await page.textContent('#shoppingTableBody');
    if (shoppingTableText.includes(testShopName)) {
      testResults.push({ name: 'Shopping List Add & Render', status: 'PASS', details: `Added "${testShopName}"` });
      console.log('  ✔ PASS: Quick-added item to shopping list.');
    } else {
      testResults.push({ name: 'Shopping List Add & Render', status: 'FAIL', details: 'Item not in shopping table' });
      console.log('  ✖ FAIL: Item not found in shopping table.');
    }

    // Toggle purchased status
    const shopRow = page.locator(`#shoppingTableBody tr:has-text("${testShopName}")`);
    await shopRow.locator('.shopping-checkbox').click();
    await page.waitForTimeout(400);

    const isPurchased = await shopRow.evaluate(el => el.classList.contains('purchased'));
    console.log(`  ✔ Toggle item completed/purchased: ${isPurchased ? 'YES' : 'NO'}`);
    
    await takeScreenshot(page, '08_shopping_list.png', 'Shopping List with Purchased Toggle');

    testResults.push({ name: 'Shopping List Status Toggle', status: isPurchased ? 'PASS' : 'FAIL', details: 'Toggled purchased state', screenshot: '08_shopping_list.png' });

    // ----------------------------------------------------
    // TEST 10: Multer CSV Shopping Import
    // ----------------------------------------------------
    console.log('\n▶ Test 10: Testing CSV Shopping Import via Multer...');
    const testCsvPath = path.join(__dirname, 'test_qa_groceries.csv');
    const csvData = `itemName,quantity,category\n${testCsvItemName},1 loaf,Food Grains\n`;
    fs.writeFileSync(testCsvPath, csvData);

    const csvInput = await page.$('#shoppingCsvFile');
    await csvInput.setInputFiles(testCsvPath);
    await page.waitForTimeout(800);

    // Check if confirm modal appeared
    const confirmModalVisible = await page.evaluate(() => document.getElementById('confirmModal').classList.contains('show'));
    if (confirmModalVisible) {
      await page.click('#confirmModalConfirmBtn');
      await page.waitForTimeout(800);
    }

    const updatedShoppingText = await page.textContent('#shoppingTableBody');
    const csvSuccess = updatedShoppingText.includes(testCsvItemName);
    try { fs.unlinkSync(testCsvPath); } catch (_) {}

    await takeScreenshot(page, '09_csv_import.png', 'CSV Grocery Import Success');

    if (csvSuccess) {
      testResults.push({ name: 'Multer CSV Import & Preview', status: 'PASS', details: 'CSV parsed and items imported', screenshot: '09_csv_import.png' });
      console.log('  ✔ PASS: CSV imported and items added to shopping list.');
    } else {
      testResults.push({ name: 'Multer CSV Import & Preview', status: 'FAIL', details: 'CSV items not found', screenshot: '09_csv_import.png' });
      console.log('  ✖ FAIL: CSV items not found in shopping table.');
    }

    // ----------------------------------------------------
    // TEST 11: Profile & Settings Update
    // ----------------------------------------------------
    console.log('\n▶ Test 11: Testing Profile Settings Update...');
    await page.click('.nav-item[data-view="profile"]');
    await page.waitForTimeout(500);

    await page.fill('#profileName', 'Demo QA Household');
    await page.click('#profileForm button[type="submit"]');
    await page.waitForTimeout(800);

    const profileMsg = await page.textContent('#profileMessage');
    const navName = await page.textContent('.profile-name');
    
    await takeScreenshot(page, '10_profile_settings.png', 'Profile Settings Saved');

    if (profileMsg.includes('updated') || navName.includes('Demo')) {
      testResults.push({ name: 'Profile Settings & Identity Update', status: 'PASS', details: `Profile message: "${profileMsg.trim()}"`, screenshot: '10_profile_settings.png' });
      console.log(`  ✔ PASS: Profile updated successfully: "${profileMsg.trim()}"`);
    } else {
      testResults.push({ name: 'Profile Settings & Identity Update', status: 'FAIL', details: profileMsg, screenshot: '10_profile_settings.png' });
      console.log('  ✖ FAIL: Profile update error.');
    }

    // ----------------------------------------------------
    // TEST 12: Data Persistence on Page Refresh
    // ----------------------------------------------------
    console.log('\n▶ Test 12: Testing Data Persistence Across Page Refresh...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const stillLoggedIn = await page.isVisible('#appContainer');
    await page.click('.nav-item[data-view="inventory"]');
    await page.waitForTimeout(500);

    const tableAfterReload = await page.textContent('#productTableBody');
    const persisted = tableAfterReload.includes(testItemName);

    await takeScreenshot(page, '11_reload_persistence.png', 'Restored Inventory After Page Refresh');

    if (stillLoggedIn && persisted) {
      testResults.push({ name: 'Data Persistence on Reload', status: 'PASS', details: 'User session and inventory persisted from MongoDB', screenshot: '11_reload_persistence.png' });
      console.log('  ✔ PASS: Session and items persisted across page refresh.');
    } else {
      testResults.push({ name: 'Data Persistence on Reload', status: 'FAIL', details: `Logged in: ${stillLoggedIn}, Persisted: ${persisted}`, screenshot: '11_reload_persistence.png' });
      console.log('  ✖ FAIL: Persistence failed after reload.');
    }

    // ----------------------------------------------------
    // TEST 13: Clean Up Test Inventory Item (Delete)
    // ----------------------------------------------------
    console.log(`\n▶ Test 13: Cleaning Up Test Item ("${testItemName}")...`);
    const deleteRow = page.locator(`#productTableBody tr:has-text("${testItemName}")`);
    await deleteRow.locator('.action-delete').click();
    await page.waitForTimeout(400);

    // Confirm deletion modal
    await page.click('#confirmModalConfirmBtn');
    await page.waitForTimeout(800);

    const tableAfterDelete = await page.textContent('#productTableBody');
    const deleted = !tableAfterDelete.includes(testItemName);
    
    await takeScreenshot(page, '12_cleanup_deleted.png', 'Cleaned Inventory Table');

    if (deleted) {
      testResults.push({ name: 'Item Deletion & Cleanup', status: 'PASS', details: 'Test item deleted cleanly', screenshot: '12_cleanup_deleted.png' });
      console.log('  ✔ PASS: Test product deleted and cleanly removed.');
    } else {
      testResults.push({ name: 'Item Deletion & Cleanup', status: 'FAIL', details: 'Item still in table', screenshot: '12_cleanup_deleted.png' });
      console.log('  ✖ FAIL: Test item still present in table.');
    }

    // ----------------------------------------------------
    // TEST 14: Logout & Protected Views
    // ----------------------------------------------------
    console.log('\n▶ Test 14: Testing Logout & Session Clearing...');
    await page.click('#profileBtn');
    await page.waitForTimeout(300);
    await page.click('#logoutBtn');
    await page.waitForTimeout(400);
    await page.click('#confirmModalConfirmBtn');
    await page.waitForTimeout(1200);

    const authContainerVisible = await page.isVisible('#authContainer');
    const tokenInStorage = await page.evaluate(() => localStorage.getItem('safeshelf_auth_token'));

    await takeScreenshot(page, '13_logged_out.png', 'Logged Out Auth Container');

    if (authContainerVisible && !tokenInStorage) {
      testResults.push({ name: 'Logout & Session Clearance', status: 'PASS', details: 'Token cleared and authContainer displayed', screenshot: '13_logged_out.png' });
      console.log('  ✔ PASS: Successfully logged out; authentication view restored.');
    } else {
      testResults.push({ name: 'Logout & Session Clearance', status: 'FAIL', details: `Token still exists: ${Boolean(tokenInStorage)}`, screenshot: '13_logged_out.png' });
      console.log('  ✖ FAIL: Logout failed.');
    }

  } catch (err) {
    console.error('\n💥 Unhandled error during browser QA testing:', err);
    testResults.push({ name: 'Execution Exception', status: 'FAIL', details: err.message });
  } finally {
    // Keep browser open for a brief moment so user can observe completion
    await page.waitForTimeout(1000);
    await browser.close();
  }

  // Summary Report
  console.log('\n====================================================');
  console.log('📋 BROWSER QA TEST EXECUTION SUMMARY:');
  console.log('====================================================');
  testResults.forEach((t, i) => {
    console.log(`[${t.status}] ${i + 1}. ${t.name} -> ${t.details}`);
  });
  console.log(`\nBrowser Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => console.log('  ⚠ ' + e));
  }
  console.log(`Network Failures: ${failedRequests.length}`);
  if (failedRequests.length > 0) {
    failedRequests.forEach(f => console.log('  ⚠ ' + f));
  }

  // Save report to disk as JSON for documentation
  const reportPath = path.join(__dirname, 'qa-browser-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    browser: 'Google Chrome (Interactive Headed)',
    total: testResults.length,
    passed: testResults.filter(t => t.status === 'PASS').length,
    failed: testResults.filter(t => t.status === 'FAIL').length,
    results: testResults,
    consoleErrors,
    failedRequests
  }, null, 2));

  console.log(`\nQA JSON report saved to: ${reportPath}`);
}

runBrowserQA().catch(console.error);
