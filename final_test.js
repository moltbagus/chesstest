
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

    await new Promise(r => server.listen(3463, r));

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    let errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://localhost:3463/', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Errors:', errors.length > 0 ? errors : 'None');

    // Check notification
    const notif = await page.evaluate(() => {
        return document.querySelector('.notification') ? document.querySelector('.notification').textContent : 'No notification';
    });
    console.log('Initial notification:', notif);

    // Click New Game
    await page.click('#new-game');
    await new Promise(r => setTimeout(r, 500));

    const notif2 = await page.evaluate(() => {
        return document.querySelector('.notification') ? document.querySelector('.notification').textContent : 'No notification';
    });
    console.log('New Game notification:', notif2);

    // Click Hint
    await page.click('#hint');
    await new Promise(r => setTimeout(r, 500));

    const notif3 = await page.evaluate(() => {
        return document.querySelector('.notification') ? document.querySelector('.notification').textContent : 'No notification';
    });
    console.log('Hint notification:', notif3);

    await page.screenshot({ path: '/Users/colbert1/chesstest/final_notif_test.png' });

    await browser.close();
    server.close();

    console.log('\n' + (notif2 !== 'No notification' ? 'SUCCESS!' : 'Still broken'));
})();
