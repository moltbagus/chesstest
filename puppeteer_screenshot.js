
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: 1280,
      height: 800
    });

    // Navigate to the page
    console.log('Navigating to https://chesstest-three.vercel.app/...');
    await page.goto('https://chesstest-three.vercel.app/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for JS to execute
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Capture screenshot
    await page.screenshot({
      path: 'chesstest_screenshot.png',
      fullPage: false
    });

    console.log('Screenshot saved to chesstest_screenshot.png');

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check if board element exists
    const boardExists = await page.evaluate(() => {
      return document.getElementById('board') !== null;
    });
    console.log('Board element exists:', boardExists);

    // Check for visible elements
    const bodyText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 200);
    });
    console.log('Body text:', bodyText);

    // Check for errors
    const errors = await page.evaluate(() => {
      return window.onerror ? 'Has error handler' : 'No error handler';
    });
    console.log('Error status:', errors);

    await browser.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
