
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

    // Get visible text
    const text = await page.evaluate(() => document.body.innerText);
    console.log('Visible text:', text.substring(0, 500));

    // Check elements
    const elements = await page.evaluate(() => {
      return {
        board: !!document.getElementById('board'),
        squares: document.querySelectorAll('.square').length,
        pieces: document.querySelectorAll('.piece').length,
        themeSelect: !!document.getElementById('theme-select'),
        pieceSelect: !!document.getElementById('piece-style-select'),
        newGameBtn: !!document.getElementById('new-game'),
        puzzleBtn: !!document.getElementById('puzzle-mode'),
      };
    });

    console.log('Elements:', JSON.stringify(elements, null, 2));

    await page.screenshot({ path: 'new_deployment_final.png', fullPage: false });
    console.log('Screenshot saved');

    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
