
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('https://chesstest-three.vercel.app', { 
    waitUntil: 'networkidle2', 
    timeout: 30000 
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('=== Initial state ===');
  let squares = await page.evaluate(() => document.querySelectorAll('.square').length);
  let pieces = await page.evaluate(() => document.querySelectorAll('.piece').length);
  let selected = await page.evaluate(() => document.querySelectorAll('.square.selected').length);
  let validMoves = await page.evaluate(() => document.querySelectorAll('.square.valid-move').length);
  console.log(`Squares: ${squares}, Pieces: ${pieces}, Selected: ${selected}, Valid moves: ${validMoves}`);

  // Try clicking on a pawn (e2 - row 6, col 4)
  console.log('\n=== Clicking on e2 pawn ===');
  const square = await page.locator('.square[data-row="6"][data-col="4"]');
  await square.click();
  await new Promise(resolve => setTimeout(resolve, 500));

  selected = await page.evaluate(() => document.querySelectorAll('.square.selected').length);
  validMoves = await page.evaluate(() => document.querySelectorAll('.square.valid-move').length);
  console.log(`After click - Selected: ${selected}, Valid moves: ${validMoves}`);

  // Get valid move positions
  const moves = await page.evaluate(() => {
    const squares = document.querySelectorAll('.square.valid-move');
    return Array.from(squares).map(s => `${s.dataset.row},${s.dataset.col}`);
  });
  console.log('Valid move positions:', moves);

  // If there are valid moves, click one
  if (moves.length > 0) {
    console.log('\n=== Making a move ===');
    const moveTarget = moves[0].split(',');
    const targetSquare = await page.locator(`.square[data-row="${moveTarget[0]}"][data-col="${moveTarget[1]}"]`);
    await targetSquare.click();
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('After move:');
    pieces = await page.evaluate(() => document.querySelectorAll('.piece').length);
    console.log(`Pieces: ${pieces}`);

    const status = await page.evaluate(() => document.getElementById('status').textContent);
    console.log(`Status: ${status}`);
  }

  // Test New Game button
  console.log('\n=== Testing New Game button ===');
  await page.click('#new-game');
  await new Promise(resolve => setTimeout(resolve, 500));

  pieces = await page.evaluate(() => document.querySelectorAll('.piece').length);
  console.log(`After New Game - Pieces: ${pieces}`);

  // Check console for errors
  const consoleOutput = await page.evaluate(() => {
    return window.__consoleErrors || [];
  });
  if (consoleOutput.length > 0) {
    console.log('\nConsole errors:', consoleOutput);
  }

  await page.screenshot({ path: 'gameplay_test.png' });
  console.log('\nScreenshot saved');

  await browser.close();
})();
