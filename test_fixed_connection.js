import axios from 'axios';

// 测试修复后的API连接
async function testFixedConnection() {
  console.log('=== 测试修复后的API连接 ===\n');
  
  // 1. 测试健康检查端点
  console.log('1️⃣ 测试健康检查端点...');
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✅ 后端健康检查:', response.data.message);
  } catch (error) {
    console.log('❌ 后端连接失败:', error.message);
    console.log('💡 请确保后端服务器运行在3000端口');
    return;
  }
  
  // 2. 测试登录端点
  console.log('\n2️⃣ 测试登录端点...');
  try {
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'teacher1763610712207@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录API正常工作');
      console.log('✅ Token获取成功:', token.substring(0, 20) + '...');
      
      // 3. 测试API代理是否正常工作
      console.log('\n3️⃣ 测试API代理...');
      try {
        const meResponse = await axios.get('http://localhost:3000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (meResponse.data.success) {
          console.log('✅ API代理正常工作');
          console.log('✅ Token验证成功');
        } else {
          console.log('❌ Token验证失败');
        }
      } catch (tokenError) {
        console.log('❌ API代理测试失败:', tokenError.response?.data?.error || tokenError.message);
      }
      
    } else {
      console.log('❌ 登录API失败:', loginResponse.data.error);
    }
  } catch (error) {
    console.log('❌ 登录API测试失败:', error.response?.data?.error || error.message);
  }
  
  console.log('\n=== 连接测试完成 ===');
  console.log('🌐 现在可以测试前端页面:');
  console.log('- 登录页面: http://localhost:5173/login.html');
  console.log('- 测试页面: http://localhost:5173/test_login_fixed.html');
  console.log('- 教师系统: http://localhost:5173/teacher.html');
  console.log('\n💡 如果仍有问题，请:');
  console.log('1. 重启前端服务器 (Ctrl+C, npm run dev)');
  console.log('2. 清除浏览器缓存 (Ctrl+F5)');
  console.log('3. 检查浏览器开发者工具的网络面板');
}

testFixedConnection().catch(console.error);