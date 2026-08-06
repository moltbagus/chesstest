
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Checking chesstest-three.vercel.app...');

    await page.goto("https://chesstest-three.vercel.app", {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const currentUrl = page.url();
    console.log('URL:', currentUrl);

    const title = await page.title();
    console.log('Title:', title);

    // Check board
    const boardExists = await page.evaluate(() => document.getElementById('board') !== null);
    const squares = await page.evaluate(() => document.querySelectorAll('.square').length);
    const pieces = await page.evaluate(() => document.querySelectorAll('.piece').length);

    console.log('Board:', boardExists);
    console.log('Squares:', squares);
    console.log('Pieces:', pieces);

    // Get any errors
    const errors = await page.evaluate(() => {
      const errorEls = document.querySelectorAll('[class*="error"]');
      return errorEls.length;
    });
    console.log('Error elements:', errors);

    // Body content
    const body = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
    console.log('Body:', body);

    await page.screenshot({ path: 'user_reported_issue.png', fullPage: true });
    console.log('Screenshot saved');

    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
