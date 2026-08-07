
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Loading chesstest-three.vercel.app...');

  await page.goto('https://chesstest-three.vercel.app', { 
    waitUntil: 'networkidle2', 
    timeout: 30000 
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Check elements
  const elements = await page.evaluate(() => {
    const board = document.getElementById('board');
    const newGame = document.getElementById('new-game');
    const banner = document.getElementById('banner');
    const status = document.getElementById('status');

    return {
      boardExists: !!board,
      boardHTML: board ? board.innerHTML.substring(0, 200) : 'NO BOARD',
      newGameExists: !!newGame,
      newGameText: newGame ? newGame.textContent : 'NO BUTTON',
      newGameOnClick: newGame ? newGame.onclick : 'NO HANDLER',
      bannerVisible: banner ? !banner.classList.contains('hidden') : false,
      bannerText: banner ? banner.textContent : 'NO BANNER',
      statusText: status ? status.textContent : 'NO STATUS'
    };
  });

  console.log('Elements:', JSON.stringify(elements, null, 2));

  // Try clicking New Game
  console.log('\nClicking New Game button...');
  const result = await page.evaluate(() => {
    const btn = document.getElementById('new-game');
    if (btn) {
      btn.click();
      return 'Clicked successfully';
    }
    return 'Button not found';
  });
  console.log('Click result:', result);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check again
  const afterClick = await page.evaluate(() => {
    const banner = document.getElementById('banner');
    return {
      bannerVisible: banner ? !banner.classList.contains('hidden') : false,
      bannerText: banner ? banner.textContent : 'NO BANNER'
    };
  });
  console.log('After click:', JSON.stringify(afterClick, null, 2));

  await page.screenshot({ path: 'debug_newgame.png' });
  console.log('Screenshot saved');

  await browser.close();
})();
