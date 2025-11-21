import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function finalLoginVerification() {
  console.log('=== 最终登录验证 ===\n');
  
  // 1. 验证服务器状态
  console.log('1️⃣ 验证服务器状态...');
  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ 后端服务器正常:', response.data.message);
  } catch (error) {
    console.log('❌ 后端服务器异常:', error.message);
    return;
  }
  
  // 2. 验证登录功能
  console.log('\n2️⃣ 验证登录功能...');
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher1763610712207@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      const user = loginResponse.data.data;
      
      console.log('✅ 登录成功:');
      console.log('  - 用户名:', user.username);
      console.log('  - 邮箱:', user.email);
      console.log('  - 角色:', user.user_metadata?.role);
      console.log('  - Token获取: ✅');
      
      // 3. 验证token有效性
      console.log('\n3️⃣ 验证token有效性...');
      try {
        const verifyResponse = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (verifyResponse.data.success) {
          console.log('✅ Token验证成功');
          console.log('  - 用户ID:', verifyResponse.data.data.user_id);
          console.log('  - 认证状态:', verifyResponse.data.data.aud);
        } else {
          console.log('❌ Token验证失败');
        }
      } catch (tokenError) {
        console.log('❌ Token验证异常:', tokenError.response?.data?.error || tokenError.message);
      }
      
    } else {
      console.log('❌ 登录失败:', loginResponse.data.error);
    }
  } catch (error) {
    console.log('❌ 登录请求异常:', error.response?.data?.error || error.message);
  }
  
  console.log('\n=== 验证完成 ===');
  console.log('🌐 测试页面: http://localhost:5173/test_login_fixed.html');
  console.log('🏠 主登录页: http://localhost:5173/login.html');
  console.log('👨‍🏫 教师系统: http://localhost:5173/teacher.html');
  console.log('\n📝 使用账号:');
  console.log('  邮箱: teacher1763610712207@example.com');
  console.log('  密码: password123');
}

finalLoginVerification().catch(console.error);