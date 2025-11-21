import axios from 'axios';
const API_BASE = 'http://localhost:3000/api';

async function testStudentAPI() {
  try {
    // 测试登录
    console.log('测试学生登录...');
    const loginResponse = await axios.post(API_BASE + '/auth/login', {
      email: 'studentdemo@example.com',
      password: 'demo123456'
    });
    
    console.log('登录响应:', loginResponse.data);
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功，获取到token');
      
      // 测试获取项目列表
      console.log('测试获取学生项目列表...');
      try {
        const projectsResponse = await axios.get(API_BASE + '/projects?page=1&pageSize=10', {
          headers: { Authorization: 'Bearer ' + token }
        });
        
        console.log('项目列表响应:', JSON.stringify(projectsResponse.data, null, 2));
      } catch (projectError) {
        console.error('项目列表错误详情:', projectError.response?.data || projectError.message);
        if (projectError.response?.status) {
          console.error('HTTP状态码:', projectError.response.status);
        }
      }
      
      // 测试获取统计信息
      console.log('测试获取学生统计信息...');
      try {
        const statsResponse = await axios.get(API_BASE + '/stats/student', {
          headers: { Authorization: 'Bearer ' + token }
        });
        
        console.log('统计信息响应:', JSON.stringify(statsResponse.data, null, 2));
      } catch (statsError) {
        console.error('统计信息错误详情:', statsError.response?.data || statsError.message);
      }
    }
  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
  }
}

testStudentAPI();