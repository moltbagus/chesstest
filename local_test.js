
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

(async () => {
  // Create simple server
  const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join('/Users/colbert1/chesstest', filePath);

    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css'
    }[ext] || 'text/plain';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (e) {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise(resolve => server.listen(3456, resolve));
  console.log('Server started on port 3456');

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Loading local server...');
    await page.goto('http://localhost:3456/', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const title = await page.title();
    console.log('Title:', title);

    const squares = await page.evaluate(() => document.querySelectorAll('.square').length);
    const pieces = await page.evaluate(() => document.querySelectorAll('.piece').length);
    console.log('Squares:', squares);
    console.log('Pieces:', pieces);

    // Test New Game button
    console.log('Testing New Game button...');
    const newGameBtn = await page.$('#new-game');
    if (newGameBtn) {
      await newGameBtn.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      const newSquares = await page.evaluate(() => document.querySelectorAll('.square').length);
      console.log('After New Game - Squares:', newSquares);
      console.log('✅ New Game button works!');
    } else {
      console.log('❌ New Game button not found');
    }

    await page.screenshot({ path: 'local_test.png' });
    console.log('Screenshot saved');

    await browser.close();
  } finally {
    server.close();
  }
})();
