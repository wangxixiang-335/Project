import { createServer } from 'http';
import { handler } from './app.mjs';

// 创建简单的HTTP服务器来调试
const server = createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Debug</title>
      </head>
      <body>
        <h1>Debug Page</h1>
        <p>Time: ${new Date().toISOString()}</p>
        <script>
          console.log('Debug page loaded');
          fetch('http://localhost:3000/api/health')
            .then(r => r.json())
            .then(d => console.log('Backend response:', d))
            .catch(e => console.log('Backend error:', e));
        </script>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 5176;
server.listen(PORT, () => {
  console.log(`Debug server running on http://localhost:${PORT}`);
});