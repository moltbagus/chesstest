
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

    await new Promise(r => server.listen(3459, r));

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://localhost:3459/', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Check for notification
    console.log('Checking for notification...');
    const notif = await page.evaluate(() => {
        const n = document.querySelector('.notification');
        return n ? n.textContent : null;
    });
    console.log('Notification:', notif);

    // Click New Game
    console.log('\nClicking New Game...');
    await page.click('#new-game');
    await new Promise(r => setTimeout(r, 500));

    const notifAfter = await page.evaluate(() => {
        const n = document.querySelector('.notification');
        return n ? n.textContent : null;
    });
    console.log('Notification after click:', notifAfter);

    // Click Hint
    console.log('\nClicking Hint...');
    await page.click('#hint');
    await new Promise(r => setTimeout(r, 500));

    const hintNotif = await page.evaluate(() => {
        const n = document.querySelector('.notification');
        return n ? n.textContent : null;
    });
    console.log('Hint notification:', hintNotif);

    await page.screenshot({ path: '/Users/colbert1/chesstest/notification_test.png' });
    console.log('\nScreenshot saved');

    await browser.close();
    server.close();

    console.log('\n' + (notifAfter ? '✅ Notifications working!' : '❌ No notification'));
})();
