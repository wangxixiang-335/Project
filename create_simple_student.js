import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function createStudent() {
  try {
    console.log('创建测试学生账号...');
    
    // 创建学生账号
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: 'student@test.com',
      password: 'password123',
      username: 'teststudent',
      role: 'student'
    });
    
    console.log('注册响应:', registerResponse.data);
    
    if (registerResponse.data.success) {
      console.log('学生账号创建成功！');
      return registerResponse.data.data.token;
    }
    
  } catch (error) {
    console.error('创建学生失败:', error.response?.data || error.message);
    
    // 如果用户已存在，尝试登录
    if (error.response?.data?.error?.includes('already registered')) {
      console.log('用户已存在，尝试登录...');
      try {
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: 'student@test.com',
          password: 'password123'
        });
        
        console.log('登录成功:', loginResponse.data);
        return loginResponse.data.data.token;
        
      } catch (loginError) {
        console.error('登录失败:', loginError.response?.data || loginError.message);
      }
    }
  }
  
  return null;
}

// 创建学生并保存token到localStorage供前端使用
async function main() {
  const token = await createStudent();
  
  if (token) {
    console.log('获得学生token:', token);
    console.log('请在浏览器控制台运行以下命令来设置登录状态:');
    console.log(`localStorage.setItem('token', '${token}');`);
    console.log(`localStorage.setItem('userInfo', JSON.stringify({ email: 'student@test.com', role: 'student', user_id: 'test-student-id' }));`);
    console.log('然后刷新页面');
  } else {
    console.log('无法创建或登录学生账号');
  }
}

main().catch(console.error);