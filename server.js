const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, "http://" + req.headers['host']);
    const pathname = requestUrl.pathname;

    // Handle the service worker file
    if (pathname === '/firebase-messaging-sw.js') {
        fs.readFile(path.join(__dirname, 'firebase-messaging-sw.js'), (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
            }
        });
    }
    // Handle the push opt-in script
    else if (pathname === '/push-optin.js') {
        fs.readFile(path.join(__dirname, 'push-optin.js'), (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
            }
        });
    }
    else {
        // Serve the index.html file for all other requests
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});