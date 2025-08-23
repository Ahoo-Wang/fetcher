// Simple SSE (Server-Sent Events) server for demonstration purposes
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Serve the HTML file
  if (req.url === '/' || req.url === '/index.html') {
    const indexPath = path.join(__dirname, 'index.html');
    fs.readFile(indexPath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }
  // SSE endpoint
  else if (req.url === '/events') {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send a welcome message
    res.write(
      'data: {"message": "Connected to SSE server", "timestamp": "' +
        new Date().toISOString() +
        '"}\n\n',
    );

    // Send periodic events
    const interval = setInterval(() => {
      const eventData = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        message: 'Real-time update',
        data: {
          randomNumber: Math.floor(Math.random() * 100),
          eventType: ['info', 'warning', 'error', 'success'][
            Math.floor(Math.random() * 4)
          ],
        },
      };

      // Send event with custom event type
      res.write(`event: update\n`);
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    }, 3000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(interval);
      console.log('Client disconnected from SSE stream');
    });

    console.log('Client connected to SSE stream');
  }
  // Serve static files
  else {
    const filePath = path.join(__dirname, req.url);
    fs.access(filePath, fs.constants.F_OK, err => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath);
      const contentType =
        {
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpg',
          '.wav': 'audio/wav',
        }[ext] || 'text/plain';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SSE Server running on http://localhost:${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/events`);
});
