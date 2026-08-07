
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
    // Server
    const server = http.createServer((req, res) => {
        let fp = req.url === '/' ? '/index.html' : req.url;
        fp = path.join('/Users/colbert1/chesstest', fp);
        const t = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
        const ext = path.extname(fp);
        try { res.writeHead(200, { 'Content-Type': t[ext] }); res.end(fs.readFileSync(fp)); }
        catch { res.writeHead(404); res.end('Not found'); }
    });

    await new Promise(r => server.listen(3458, r));
    console.log('Server started');

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://localhost:3458/', { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Check hint button exists
    const hintBtn = await page.$('#hint');
    console.log('Hint button exists:', !!hintBtn);

    // Click hint
    console.log('\nClicking Hint button...');
    await page.click('#hint');
    await new Promise(r => setTimeout(r, 1000));

    // Check for hint squares
    const hintFrom = await page.evaluate(() => document.querySelectorAll('.hint-from').length);
    const hintTo = await page.evaluate(() => document.querySelectorAll('.hint').length);
    console.log('Hint from squares:', hintFrom);
    console.log('Hint to squares:', hintTo);

    if (hintFrom > 0 && hintTo > 0) {
        console.log('\n✅ HINT WORKING!');

        // Get the hint position
        const hintPos = await page.evaluate(() => {
            const from = document.querySelector('.hint-from');
            const to = document.querySelector('.hint');
            return {
                from: from ? from.dataset : null,
                to: to ? to.dataset : null
            };
        });
        console.log('Hint position:', JSON.stringify(hintPos));
    } else {
        console.log('\n❌ Hint not showing');
    }

    await page.screenshot({ path: '/Users/colbert1/chesstest/hint_test.png' });
    console.log('Screenshot saved');

    await browser.close();
    server.close();
})();
