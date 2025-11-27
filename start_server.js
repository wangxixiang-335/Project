import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('启动后端服务器...');

const serverProcess = spawn('node', [path.join(__dirname, 'src', 'app.js')], {
  stdio: 'inherit',
  shell: true,
  detached: true
});

serverProcess.on('error', (error) => {
  console.error('启动服务器失败:', error);
});

serverProcess.on('close', (code) => {
  console.log(`服务器进程退出，代码: ${code}`);
});

console.log('服务器进程ID:', serverProcess.pid);

// 分离进程使其在后台运行
serverProcess.unref();

// 等待一下让服务器启动
setTimeout(() => {
  console.log('服务器应该已经启动，请测试功能');
  process.exit(0);
}, 3000);