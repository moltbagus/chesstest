
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Testing: https://chesstest-5mxp9p704-moltbagus-5767s-projects.vercel.app...');

    await page.goto("https://chesstest-5mxp9p704-moltbagus-5767s-projects.vercel.app", {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const title = await page.title();
    console.log('Title:', title);

    const squares = await page.evaluate(() => document.querySelectorAll('.square').length);
    const pieces = await page.evaluate(() => document.querySelectorAll('.piece').length);

    console.log('Squares:', squares);
    console.log('Pieces:', pieces);

    if (squares === 64 && pieces === 32) {
      console.log('✅ BOARD WORKING!');
    } else if (squares === 0) {
      console.log('❌ BOARD NOT RENDERING');
    }

    await page.screenshot({ path: 'fixed_deployment.png', fullPage: true });
    console.log('Screenshot saved');

    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
