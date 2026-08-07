
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

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Detailed piece analysis
  const analysis = await page.evaluate(() => {
    const pieces = document.querySelectorAll('.piece');
    const squares = document.querySelectorAll('.square');

    // Check if pieces have visible content
    const pieceInfo = [];
    pieces.forEach((p, i) => {
      pieceInfo.push({
        index: i,
        text: p.textContent,
        fontSize: getComputedStyle(p).fontSize,
        display: getComputedStyle(p).display,
        visibility: getComputedStyle(p).visibility,
        opacity: getComputedStyle(p).opacity,
        color: getComputedStyle(p).color
      });
    });

    return {
      totalPieces: pieces.length,
      totalSquares: squares.length,
      first10Pieces: pieceInfo.slice(0, 10),
      boardDisplay: getComputedStyle(document.getElementById('board')).display,
      boardWidth: getComputedStyle(document.getElementById('board')).width,
      boardHeight: getComputedStyle(document.getElementById('board')).height
    };
  });

  console.log(JSON.stringify(analysis, null, 2));

  // Check for JavaScript errors in console
  console.log('\nChecking for JS errors...');
  const logs = await page.evaluate(() => {
    return window.consoleMessages || [];
  });

  await page.screenshot({ path: 'piece_check.png', fullPage: false });
  console.log('Screenshot saved');

  await browser.close();
})();
