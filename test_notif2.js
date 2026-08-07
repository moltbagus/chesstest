
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

    await new Promise(r => server.listen(3460, r));

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://localhost:3460/', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Initial notification (should show on page load)
    const initNotif = await page.evaluate(() => {
        return document.querySelector('.notification') ? document.querySelector('.notification').textContent : null;
    });
    console.log('Initial notification:', initNotif);

    // Click New Game
    await page.click('#new-game');
    await new Promise(r => setTimeout(r, 500));

    const newGameNotif = await page.evaluate(() => {
        return document.querySelector('.notification') ? document.querySelector('.notification').textContent : null;
    });
    console.log('New Game notification:', newGameNotif);

    // Click Hint
    await page.click('#hint');
    await new Promise(r => setTimeout(r, 500));

    const hintNotif = await page.evaluate(() => {
        return document.querySelector('.notification') ? document.querySelector('.notification').textContent : null;
    });
    console.log('Hint notification:', hintNotif);

    await page.screenshot({ path: '/Users/colbert1/chesstest/notification_test2.png' });

    await browser.close();
    server.close();

    console.log('\n' + (newGameNotif ? '✅ Notifications working!' : '❌ Still not working'));
})();
