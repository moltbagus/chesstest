
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Testing: https://chesstest-iebpfznmi-moltbagus-5767s-projects.vercel.app...');

    await page.goto("https://chesstest-iebpfznmi-moltbagus-5767s-projects.vercel.app", { 
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

    // Try clicking e2 pawn
    console.log('\nClicking e2 pawn...');
    await page.click('.square[data-row="6"][data-col="4"]');
    await new Promise(resolve => setTimeout(resolve, 500));

    const selected = await page.evaluate(() => document.querySelectorAll('.square.selected').length);
    const validMoves = await page.evaluate(() => document.querySelectorAll('.square.valid-move').length);
    console.log('Selected:', selected);
    console.log('Valid moves:', validMoves);

    // Test New Game button
    console.log('\nClicking New Game...');
    await page.click('#new-game');
    await new Promise(resolve => setTimeout(resolve, 500));

    const piecesAfter = await page.evaluate(() => document.querySelectorAll('.piece').length);
    console.log('Pieces after New Game:', piecesAfter);

    await page.screenshot({ path: 'new_deployment_test.png' });
    console.log('Screenshot saved');

    await browser.close();

    if (validMoves > 0) {
      console.log('\n✅ GAME WORKS!');
    } else {
      console.log('\n❌ Still broken - valid moves = 0');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
