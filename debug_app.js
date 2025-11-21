// 简化的应用测试
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 启动调试服务器...');

// 基本中间件
app.use(helmet());
app.use(cors());
app.use(express.json());

// 测试路由
app.get('/test', (req, res) => {
  res.json({ success: true, message: '服务器正常运行' });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ success: true, message: '服务运行正常', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`✅ 调试服务器运行在端口 ${PORT}`);
  console.log(`🌐 测试地址: http://localhost:${PORT}/test`);
  console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
});

server.on('error', (error) => {
  console.error('❌ 服务器启动失败:', error);
  process.exit(1);
});

// 10秒后自动关闭
setTimeout(() => {
  console.log('🛑 关闭调试服务器...');
  server.close(() => {
    console.log('✅ 调试服务器已关闭');
    process.exit(0);
  });
}, 10000);