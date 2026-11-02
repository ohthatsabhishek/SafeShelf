const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  const notFounds = [];
  page.on('response', res => {
    if (res.status() === 404) {
      notFounds.push(res.url());
      console.log('404:', res.url());
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(500);
  await page.fill('#loginEmail', 'demo@safeshelf.com');
  await page.fill('#loginPassword', 'password');
  await page.click('#loginForm button[type="submit"]');
  await page.waitForTimeout(1500);

  // Visit inventory
  await page.click('.nav-item[data-view="inventory"]');
  await page.waitForTimeout(1000);

  // Open add drawer & search honey
  await page.click('#openAddDrawerBtn');
  await page.waitForTimeout(500);
  await page.fill('#apiSearchInput', 'honey');
  await page.click('#apiSearchBtn');
  await page.waitForTimeout(2000);

  await browser.close();
  console.log('Total 404s:', notFounds.length);
})();
