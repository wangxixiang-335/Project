import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 启动后端服务器...');

const server = spawn('node', ['src/app.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: '8090' },
  stdio: 'inherit'
});

server.on('spawn', () => {
  console.log('✅ 服务器进程已启动');
});

server.on('error', (error) => {
  console.error('❌ 启动服务器失败:', error);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  console.log(`🛑 服务器进程退出，代码: ${code}, 信号: ${signal}`);
  process.exit(code);
});

// 捕获Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  server.kill('SIGINT');
});