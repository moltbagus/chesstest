
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to https://chesstest-k7sl84u8v-moltbagus-5767s-projects.vercel.app...');

    await page.goto("https://chesstest-k7sl84u8v-moltbagus-5767s-projects.vercel.app", {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Capture screenshot
    await page.screenshot({
      path: 'chesstest_verified.png',
      fullPage: false
    });

    console.log('Screenshot saved');

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check if board exists
    const boardExists = await page.evaluate(() => {
      return document.getElementById('board') !== null;
    });
    console.log('Board exists:', boardExists);

    // Get body text
    const bodyText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 300);
    });
    console.log('Body text:', bodyText);

    await browser.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
