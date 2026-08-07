
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

(async () => {
    const server = http.createServer((req, res) => {
        let fp = req.url === '/' ? '/index.html' : req.url;
        fp = path.join('/Users/colbert1/chesstest', fp);
        const ext = path.extname(fp);
        const t = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
        try { res.writeHead(200, { 'Content-Type': t[ext] }); res.end(fs.readFileSync(fp)); }
        catch { res.writeHead(404); res.end('Not found'); }
    });
    await new Promise(r => server.listen(3457, r));

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://localhost:3457/', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Click e2
    await page.click('.square[data-row="6"][data-col="4"]');
    await new Promise(r => setTimeout(r, 500));

    const validMoves = await page.evaluate(() => document.querySelectorAll('.square.valid-move').length);
    console.log('Valid moves:', validMoves);

    // If valid moves, make one
    if (validMoves > 0) {
        await page.locator('.square.valid-move').first().click();
        await new Promise(r => setTimeout(r, 1500));
        console.log('Move made!');

        // Check AI responded
        const pieces = await page.evaluate(() => document.querySelectorAll('.piece').length);
        console.log('Pieces:', pieces);
    }

    await page.screenshot({ path: '/Users/colbert1/chesstest/working_game.png' });
    console.log('Screenshot saved');

    await browser.close();
    server.close();
})();
