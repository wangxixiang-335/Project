import axios from 'axios';

async function testProjectDetail() {
  try {
    console.log('🔍 测试项目详情API...');
    
    // 先登录
    console.log('1. 教师登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'teacher1763449748933@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功');
      
      // 获取待审批项目列表
      console.log('2. 获取待审批项目列表...');
      const projectsResponse = await axios.get('http://localhost:3000/api/teacher/pending-projects', {
        headers: { Authorization: 'Bearer ' + token },
        params: { page: 1, pageSize: 10 }
      });
      
      console.log('待审批项目响应:', JSON.stringify(projectsResponse.data, null, 2));
      
      if (projectsResponse.data.success && projectsResponse.data.data.items.length > 0) {
        const projectId = projectsResponse.data.data.items[0].id;
        console.log('3. 测试项目详情，项目ID:', projectId);
        
        // 测试项目详情API
        const detailResponse = await axios.get('http://localhost:3000/api/projects/' + projectId, {
          headers: { Authorization: 'Bearer ' + token }
        });
        
        console.log('项目详情结果:', JSON.stringify(detailResponse.data, null, 2));
      } else {
        console.log('⚠️ 没有待审批项目');
      }
    } else {
      console.log('❌ 登录失败:', loginResponse.data.error);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testProjectDetail();