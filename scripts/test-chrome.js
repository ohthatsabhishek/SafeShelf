const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  const title = await page.title();
  console.log('Successfully launched real Google Chrome! Page Title:', title);
  await browser.close();
})().catch(err => {
  console.error('Launch error:', err);
  process.exit(1);
});
