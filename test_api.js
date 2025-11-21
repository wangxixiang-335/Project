import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testRegister() {
  try {
    console.log('🧪 测试用户注册...');
    const response = await axios.post(`${API_BASE}/auth/register`, {
      email: 'testuser@example.com',
      password: 'test123456',
      username: '测试用户',
      role: 'student'
    });
    
    console.log('✅ 注册成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ 注册失败:', error.response?.data || error.message);
    return null;
  }
}

async function testLogin() {
  try {
    console.log('🧪 测试用户登录...');
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'testuser@example.com',
      password: 'test123456'
    });
    
    console.log('✅ 登录成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
    return null;
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始API测试...\n');
  
  // 测试注册
  const user = await testRegister();
  
  if (user) {
    console.log('\n🎯 注册的用户信息:', user);
    
    // 测试登录
    console.log('\n--- 分隔线 ---\n');
    const loggedInUser = await testLogin();
    
    if (loggedInUser) {
      console.log('\n🎉 所有测试通过！');
    }
  }
  
  console.log('\n🏁 测试完成');
}

runTests();