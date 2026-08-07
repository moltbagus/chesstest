
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

(async () => {
    // Start server
    const server = http.createServer((req, res) => {
        let filePath = req.url === '/' ? '/index.html' : req.url;
        filePath = path.join('/Users/colbert1/chesstest', filePath);
        const ext = path.extname(filePath);
        const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
        try {
            const content = fs.readFileSync(filePath);
            res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
            res.end(content);
        } catch (e) {
            res.writeHead(404);
            res.end('Not found');
        }
    });

    await new Promise(resolve => server.listen(3456, resolve));
    console.log('Server started');

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Loading...');
    await page.goto('http://localhost:3456/', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const squares = await page.evaluate(() => document.querySelectorAll('.square').length);
    const pieces = await page.evaluate(() => document.querySelectorAll('.piece').length);
    console.log('Squares:', squares);
    console.log('Pieces:', pieces);

    // Click e2 pawn
    console.log('\nClicking e2 pawn...');
    await page.click('.square[data-row="6"][data-col="4"]');
    await new Promise(resolve => setTimeout(resolve, 500));

    const selected = await page.evaluate(() => document.querySelectorAll('.square.selected').length);
    const validMoves = await page.evaluate(() => document.querySelectorAll('.square.valid-move').length);
    console.log('Selected:', selected);
    console.log('Valid moves:', validMoves);

    // Make a move
    if (validMoves > 0) {
        console.log('\nMaking move...');
        const firstMove = await page.locator('.square.valid-move').first();
        await firstMove.click();
        await new Promise(resolve => setTimeout(resolve, 1500));

        const piecesAfter = await page.evaluate(() => document.querySelectorAll('.piece').length);
        console.log('Pieces after move:', piecesAfter);

        const status = await page.evaluate(() => document.getElementById('status').textContent);
        console.log('Status:', status);
    }

    await page.screenshot({ path: 'local_final_test.png' });
    console.log('\nScreenshot saved');

    await browser.close();
    server.close();

    console.log('\n' + (validMoves > 0 ? '✅ GAME WORKS!' : '❌ GAME BROKEN'));
})();
