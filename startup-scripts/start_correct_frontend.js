const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动正确的前端服务器...');

const frontendPath = path.join(__dirname, 'temp-frontend');
const process = spawn('npm', ['run', 'dev'], {
  cwd: frontendPath,
  stdio: 'inherit',
  shell: true
});

process.on('close', (code) => {
  console.log(`前端服务器关闭，退出码: ${code}`);
});

process.on('error', (err) => {
  console.error('启动前端服务器失败:', err);
});

console.log('✅ 前端服务器正在启动...');
console.log('📁 前端目录:', frontendPath);
console.log('🌐 请访问: http://localhost:5176/');
console.log('📝 如果看到端口占用，请停止其他前端服务');
console.log('💡 按 Ctrl+C 停止服务器');