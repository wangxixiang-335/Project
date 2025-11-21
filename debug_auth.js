import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function debugAuth() {
  console.log('=== 调试认证问题 ===\n');

  // 测试1: 检查服务器状态
  console.log('1. 检查服务器状态...');
  try {
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ 服务器状态:', healthResponse.data);
  } catch (error) {
    console.log('❌ 服务器状态检查失败:', error.message);
    return;
  }

  // 测试2: 尝试注册新用户
  console.log('\n2. 测试用户注册...');
  const testUser = {
    email: `debug_${Date.now()}@example.com`,
    password: 'debug123456',
    username: `debuguser_${Date.now()}`,
    role: 'student'
  };

  try {
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
    console.log('✅ 注册成功:', registerResponse.data);
  } catch (error) {
    console.log('❌ 注册失败:');
    if (error.response) {
      console.log('   状态码:', error.response.status);
      console.log('   错误信息:', error.response.data);
    } else {
      console.log('   网络错误:', error.message);
    }
  }

  // 测试3: 使用已知用户登录
  console.log('\n3. 测试用户登录...');
  const loginData = {
    email: 'test1763088741241@example.com',
    password: 'test123456'
  };

  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    console.log('✅ 登录成功:', loginResponse.data);
    
    // 测试4: 使用token获取用户信息
    console.log('\n4. 测试Token验证...');
    const token = loginResponse.data.data.token;
    const userResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Token验证成功:', userResponse.data);
    
    // 测试5: 尝试提交项目
    console.log('\n5. 测试项目提交...');
    const projectData = {
      title: '调试测试项目',
      content_html: '<p>这是调试内容</p>',
      category: 'web'
    };
    
    const projectResponse = await axios.post(`${API_BASE}/projects`, projectData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ 项目提交成功:', projectResponse.data);
    
  } catch (error) {
    console.log('❌ 登录或后续操作失败:');
    if (error.response) {
      console.log('   状态码:', error.response.status);
      console.log('   错误信息:', error.response.data);
      console.log('   请求配置:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    } else {
      console.log('   网络错误:', error.message);
    }
  }
}

debugAuth();