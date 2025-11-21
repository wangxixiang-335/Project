import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function debugAuthIssue() {
  try {
    console.log('1. 使用已有用户登录...');
    const loginData = {
      email: 'authtest@example.com',
      password: '123456'
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    console.log('登录成功');
    
    const token = loginResponse.data.data.token;
    
    console.log('\n2. 解码token查看内容...');
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token载荷:', payload);
    
    console.log('\n3. 测试/auth/me接口详细错误...');
    try {
      const meResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ 获取用户信息成功:', meResponse.data);
    } catch (error) {
      console.log('❌ 获取用户信息失败');
      console.log('错误状态:', error.response?.status);
      console.log('错误数据:', error.response?.data);
    }
    
  } catch (error) {
    console.log('调试错误:', error.response?.data || error.message);
  }
}

console.log('开始认证问题调试...');
debugAuthIssue();