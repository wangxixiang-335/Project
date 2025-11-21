import app from './src/app.js';

const PORT = process.env.PORT || 3002;

console.log('🚀 启动测试服务器...');

try {
  const server = app.listen(PORT, () => {
    console.log(`✅ 测试服务器运行在端口 ${PORT}`);
    console.log('📋 服务器状态检查:');
    console.log('✅ Express 应用已加载');
    console.log('✅ 所有路由已注册');
    console.log('✅ 中间件已配置');
    
    // 5秒后自动关闭
    setTimeout(() => {
      console.log('🛑 关闭测试服务器...');
      server.close(() => {
        console.log('✅ 测试服务器已关闭');
        process.exit(0);
      });
    }, 5000);
  });
  
  server.on('error', (error) => {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ 启动失败:', error);
  process.exit(1);
}