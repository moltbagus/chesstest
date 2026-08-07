
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
    const server = http.createServer((req, res) => {
        let fp = req.url === '/' ? '/index.html' : req.url;
        fp = path.join('/Users/colbert1/chesstest', fp);
        const t = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
        try { res.writeHead(200, { 'Content-Type': t[path.extname(fp)] }); res.end(fs.readFileSync(fp)); }
        catch { res.writeHead(404); res.end('Not found'); }
    });

    await new Promise(r => server.listen(3461, r));

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => console.log('Browser:', msg.text()));
    page.on('pageerror', err => console.log('ERROR:', err.message));

    await page.goto('http://localhost:3461/', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Click New Game
    await page.click('#new-game');
    await new Promise(r => setTimeout(r, 500));

    await browser.close();
    server.close();
})();
