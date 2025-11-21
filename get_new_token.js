import axios from 'axios';

async function getNewToken() {
  const API_BASE = 'http://localhost:3000/api';
  
  try {
    console.log('🔑 尝试登录获取新token...');
    
    // 使用测试教师账号登录
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'testteacher123@example.com',
      password: '123456'
    });
    
    if (loginResponse.data.success && loginResponse.data.data.token) {
      const newToken = loginResponse.data.data.token;
      console.log('✅ 获取新token成功:');
      console.log('📋 Token:', newToken.substring(0, 50) + '...');
      console.log('📋 用户信息:', loginResponse.data.data.user);
      
      // 测试新token
      console.log('\n🧪 测试新token...');
      const testResponse = await axios.get(`${API_BASE}/teacher/student-achievements`, {
        headers: { Authorization: `Bearer ${newToken}` },
        params: { page: 1, pageSize: 10 }
      });
      
      console.log('✅ API调用成功:', testResponse.status);
      console.log('📋 返回数据:', testResponse.data);
      
    } else {
      console.log('❌ 登录失败:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ 获取token失败:', error.response?.data || error.message);
  }
}

getNewToken();