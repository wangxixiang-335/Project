import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function createTestTeacher() {
  try {
    console.log('创建测试教师账号...');
    
    // 创建教师账号
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: 'teacher@example.com',
      password: 'password123',
      username: 'testteacher',
      role: 'teacher'
    });
    
    console.log('注册响应:', registerResponse.data);
    
    if (registerResponse.data.success) {
      console.log('教师账号创建成功！');
      
      // 测试登录
      console.log('\n测试登录...');
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
    }
    
  } catch (error) {
    console.error('创建/登录测试失败:', error.response?.data || error.message);
  }
}

createTestTeacher();