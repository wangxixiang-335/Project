import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing server startup...');

const server = spawn('node', ['src/app.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

server.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`[ERROR] ${data}`);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// 5秒后自动终止
setTimeout(() => {
  server.kill();
  console.log('Test completed.');
  process.exit(0);
}, 5000);