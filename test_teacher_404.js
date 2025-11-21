import axios from 'axios';

async function testTeacherProjects() {
  try {
    console.log('🧪 开始测试教师项目列表API...');
    
    // First, let's try to login as a teacher
    console.log('🔑 尝试教师登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'teacher1',
      password: '123456'
    });
    
    console.log('✅ 登录响应:', loginResponse.data);
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('🔑 获取token成功:', token.substring(0, 20) + '...');
      
      // Test the teacher projects endpoint
      console.log('📋 测试教师项目列表端点...');
      const projectsResponse = await axios.get('http://localhost:3000/api/teacher/projects', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      
      console.log('✅ 项目列表响应:', projectsResponse.data);
    }
  } catch (error) {
    console.error('❌ 错误:', error.response?.data || error.message);
    if (error.response) {
      console.error('📊 状态码:', error.response.status);
      console.error('📋 错误详情:', error.response.data);
    }
  }
}

testTeacherProjects();