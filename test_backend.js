import express from 'express';
import cors from 'cors';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// 测试端点
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint works', timestamp: new Date().toISOString() });
});

// 测试认证端点（不需要token）
app.get('/api/projects/test', (req, res) => {
  res.json({ 
    items: [
      {
        id: 'test-1',
        title: '测试项目1',
        status: 2,
        created_at: new Date().toISOString()
      }
    ],
    total: 1
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`测试服务器运行在端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`测试端点: http://localhost:${PORT}/api/test`);
  console.log(`项目测试端点: http://localhost:${PORT}/api/projects/test`);
});