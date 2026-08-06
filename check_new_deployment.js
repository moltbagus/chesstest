
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Checking NEW deployment: https://chesstest-oy5b60kek-moltbagus-5767s-projects.vercel.app...');

    await page.goto("https://chesstest-oy5b60kek-moltbagus-5767s-projects.vercel.app", {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const currentUrl = page.url();
    console.log('Redirected to:', currentUrl);

    const title = await page.title();
    console.log('Page title:', title);

    const boardExists = await page.evaluate(() => document.getElementById('board') !== null);
    console.log('Board exists:', boardExists);

    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log('Content:', bodyText);

    await page.screenshot({ path: 'new_deployment_check.png', fullPage: false });
    console.log('Screenshot saved');

    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
