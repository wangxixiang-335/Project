import axios from 'axios';

async function testRealEndpoints() {
  try {
    console.log('🔑 1. 教师登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'teacher1763449748933@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功');
      
      // 测试各个端点
      const endpoints = [
        '/teacher/my-projects',
        '/teacher/projects', 
        '/teacher/pending-projects'
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`\n🔄 测试 ${endpoint}...`);
          const response = await axios.get(`http://localhost:3000/api${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`✅ ${endpoint}: ${response.status} - ${response.data.message || '成功'}`);
        } catch (error) {
          if (error.response) {
            console.error(`❌ ${endpoint}: ${error.response.status} - ${error.response.statusText}`);
            console.error(`📋 错误详情: ${JSON.stringify(error.response.data)}`);
            if (error.response.status === 404) {
              console.error(`🎯 发现404错误！这个可能是真正的问题`);
            }
          } else {
            console.error(`❌ ${endpoint}: ${error.message}`);
          }
        }
      }
    } else {
      console.error('❌ 登录失败:', loginResponse.data.error);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testRealEndpoints();