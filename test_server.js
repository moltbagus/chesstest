
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join('/Users/colbert1/chesstest', filePath);

    const ext = path.extname(filePath);
    const types = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css'
    };

    try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
        res.end(content);
    } catch (e) {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(3456, () => {
    console.log('Server running on port 3456');
});
