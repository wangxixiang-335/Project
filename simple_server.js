import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = 8090;

console.log('🚀 启动简化服务器...');

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

// 简单的通知测试路由
app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

const server = app.listen(PORT, () => {
  console.log(`✅ 简化服务器运行在端口 ${PORT}`);
  console.log(`🌐 测试地址: http://localhost:${PORT}/test`);
  console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
  console.log(`📨 通知API: http://localhost:${PORT}/api/notifications`);
});

server.on('error', (error) => {
  console.error('❌ 服务器启动失败:', error);
  process.exit(1);
});