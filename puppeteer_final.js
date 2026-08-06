
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to https://chesstest-2bb0r56ok-moltbagus-5767s-projects.vercel.app...');

    await page.goto("https://chesstest-2bb0r56ok-moltbagus-5767s-projects.vercel.app", {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const title = await page.title();
    console.log('Page title:', title);

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    const boardExists = await page.evaluate(() => document.getElementById('board') !== null);
    console.log('Board exists:', boardExists);

    const squareCount = await page.evaluate(() => document.querySelectorAll('.square').length);
    console.log('Squares:', squareCount);

    const pieceCount = await page.evaluate(() => document.querySelectorAll('.piece').length);
    console.log('Pieces:', pieceCount);

    await page.screenshot({ path: 'chesstest_final.png', fullPage: false });
    console.log('Screenshot saved');

    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
