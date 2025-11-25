import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function createTeacher() {
  try {
    console.log('创建测试教师账号...');
    
    // 使用一个简单的邮箱和密码创建教师
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: 'teacher@test.com',
      password: 'password123',
      username: 'testteacher',
      role: 'teacher'
    });
    
    console.log('注册响应:', registerResponse.data);
    
    if (registerResponse.data.success) {
      console.log('教师账号创建成功！');
      
      if (registerResponse.data.data.token) {
        console.log('已获得登录token，测试认证...');
        
        // 测试获取用户信息
        const meResponse = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${registerResponse.data.data.token}` }
        });
        
        console.log('用户信息验证:', meResponse.data);
      }
    }
    
  } catch (error) {
    console.error('创建教师失败:', error.response?.data || error.message);
    
    // 如果创建失败，尝试登录现有账号
    if (error.response?.data?.error?.includes('already registered')) {
      console.log('用户已存在，尝试登录...');
      try {
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: 'teacher@test.com',
          password: 'password123'
        });
        
        console.log('登录成功:', loginResponse.data);
        
        // 测试获取用户信息
        if (loginResponse.data.success) {
          const meResponse = await axios.get(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${loginResponse.data.data.token}` }
          });
          
          console.log('用户信息:', meResponse.data);
        }
      } catch (loginError) {
        console.error('登录失败:', loginError.response?.data || loginError.message);
      }
    }
  }
}

createTeacher();