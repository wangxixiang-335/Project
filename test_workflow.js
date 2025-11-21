import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testFullWorkflow() {
  try {
    console.log('1. 注册新用户...');
    const registerData = {
      email: 'teststudent@example.com',
      password: '123456',
      username: 'teststudent',
      role: 'student'
    };
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, registerData);
    console.log('注册响应:', registerResponse.data);
    
    if (!registerResponse.data.success) {
      console.log('注册失败，尝试登录...');
      // 如果注册失败，尝试登录
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: registerData.email,
        password: registerData.password
      });
      console.log('登录响应:', loginResponse.data);
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.token;
        await testWithToken(token);
      }
    } else {
      // 注册成功，使用返回的token
      const token = registerResponse.data.data.token;
      await testWithToken(token);
    }
    
  } catch (error) {
    console.log('工作流测试错误:', error.response?.data || error.message);
  }
}

async function testWithToken(token) {
  console.log('\n2. 使用token获取用户信息...');
  try {
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('用户信息:', meResponse.data);
  } catch (error) {
    console.log('获取用户信息错误:', error.response?.data || error.message);
  }
  
  console.log('\n3. 使用token提交项目...');
  try {
    const projectResponse = await axios.post(`${API_BASE}/projects`, {
      title: '测试项目',
      content_html: '<h3>项目介绍</h3><p>这是一个测试项目，使用纯文字描述。</p><h4>功能特点</h4><ul><li>简洁易用</li><li>支持文字描述</li><li>快速提交</li></ul>',
      video_url: ''
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('项目提交成功:', projectResponse.data);
  } catch (error) {
    console.log('项目提交错误:', error.response?.data || error.message);
    
    // 如果是验证错误，打印更详细的信息
    if (error.response?.data?.details) {
      console.log('验证错误详情:', error.response.data.details);
    }
  }
}

console.log('开始完整工作流测试...');
testFullWorkflow();