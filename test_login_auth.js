import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testAuth() {
  try {
    console.log('测试教师登录...');
    
    // 测试教师登录
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher@example.com',
      password: 'password123'
    });
    
    console.log('登录响应:', {
      success: loginResponse.data.success,
      token: loginResponse.data.data?.token ? 'exists' : 'missing',
      userRole: loginResponse.data.data?.role,
      userName: loginResponse.data.data?.username
    });
    
    if (loginResponse.data.success) {
      console.log('登录成功！用户信息:', loginResponse.data.data);
    }
    
  } catch (error) {
    console.error('登录测试失败:', error.response?.data || error.message);
  }
}

testAuth();