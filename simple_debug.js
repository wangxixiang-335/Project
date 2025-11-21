import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function simpleDebug() {
  console.log('=== 简化调试 ===\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await axios.get(`http://localhost:3000/health`);
    console.log('✅ 健康检查:', healthResponse.data);

    // 2. 注册新用户
    console.log('\n2. 注册新用户...');
    const userData = {
      email: `simple_${Date.now()}@test.com`,
      password: 'test123456',
      username: `user_${Date.now()}`,
      role: 'student'
    };
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, userData);
    console.log('✅ 注册成功');

    // 3. 登录
    console.log('\n3. 用户登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: userData.email,
      password: userData.password
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功, token长度:', token.length);

    // 4. 提交项目
    console.log('\n4. 提交项目...');
    const projectData = {
      title: '调试项目',
      content_html: '<p>测试内容</p>',
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
    console.log('\n❌ 错误详情:');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误数据:', JSON.stringify(error.response.data, null, 2));
      console.log('请求URL:', error.config?.url);
      console.log('请求方法:', error.config?.method);
    } else {
      console.log('网络错误:', error.message);
    }
  }
}

simpleDebug();