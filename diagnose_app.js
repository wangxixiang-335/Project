console.log('🔍 开始诊断主应用...');

try {
  console.log('1️⃣ 测试环境变量...');
  const dotenv = await import('dotenv');
  dotenv.config();
  console.log('✅ 环境变量加载成功');
  
  console.log('2️⃣ 测试Supabase配置...');
  const { validateConfig } = await import('./src/config/supabase.js');
  try {
    validateConfig();
    console.log('✅ Supabase配置验证通过');
  } catch (supabaseError) {
    console.log('⚠️ Supabase配置警告:', supabaseError.message);
  }
  
  console.log('3️⃣ 测试路由导入...');
  const userRoutes = await import('./src/routes/users.js');
  console.log('✅ 用户路由导入成功');
  
  const projectRoutes = await import('./src/routes/projects.js');
  console.log('✅ 项目路由导入成功');
  
  const notificationRoutes = await import('./src/routes/notifications.js');
  console.log('✅ 通知路由导入成功');
  
  const projectManagementRoutes = await import('./src/routes/project-management.js');
  console.log('✅ 项目管理路由导入成功');
  
  console.log('🎉 所有模块导入成功！');
  
} catch (error) {
  console.error('❌ 诊断失败:', error.message);
  console.error('📍 错误位置:', error.stack);
  process.exit(1);
}