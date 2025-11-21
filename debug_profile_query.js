import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 模拟后端的token验证逻辑
function decodeTokenPayload(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    return null;
  }
}

async function debugProfileQuery() {
  try {
    console.log('1. 登录获取token...');
    const loginData = {
      email: 'authtest@example.com',
      password: '123456'
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    const token = loginResponse.data.data.token;
    console.log('登录成功，token获取成功');
    
    // 解码token查看用户ID
    const payload = decodeTokenPayload(token);
    console.log('\n2. Token载荷中的用户ID:', payload.sub);
    console.log('Token中的用户信息:', {
      email: payload.email,
      username: payload.user_metadata?.username,
      role: payload.user_metadata?.role
    });
    
    console.log('\n3. 手动检查profiles表...');
    // 我们需要模拟后端的查询
    // 先试试最简单的查询
    try {
      const response = await fetch(`${API_BASE}/stats/student`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('学生统计API响应:', data);
      
    } catch (statsError) {
      console.log('统计API错误:', statsError.message);
    }
    
    // 尝试项目提交，看看详细的错误信息
    console.log('\n4. 尝试项目提交...');
    try {
      const projectResponse = await axios.post(`${API_BASE}/projects`, {
        title: '测试项目提交',
        content_html: '<p>简单的测试内容</p>',
        video_url: ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ 项目提交成功:', projectResponse.data);
    } catch (projectError) {
      console.log('❌ 项目提交失败');
      console.log('错误状态:', projectError.response?.status);
      console.log('错误数据:', projectError.response?.data);
      
      // 如果是验证错误，检查具体字段
      if (projectError.response?.data?.details) {
        console.log('验证错误详情:', projectError.response.data.details);
      }
    }
    
  } catch (error) {
    console.log('调试错误:', error.response?.data || error.message);
  }
}

console.log('开始profile查询调试...');
debugProfileQuery();