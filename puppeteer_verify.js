
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
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for JS to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Capture screenshot
    await page.screenshot({
      path: 'chesstest_new_deployment.png',
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

    // Check board squares
    const squareCount = await page.evaluate(() => {
      return document.querySelectorAll('.square').length;
    });
    console.log('Board squares:', squareCount);

    // Check pieces
    const pieceCount = await page.evaluate(() => {
      return document.querySelectorAll('.piece').length;
    });
    console.log('Pieces on board:', pieceCount);

    // Check for console errors
    const errors = await page.evaluate(() => {
      return window.onerror ? 'Has error handler' : 'No errors';
    });
    console.log('Error status:', errors);

    await browser.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
