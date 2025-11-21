import axios from 'axios';

async function testTeacherProjectDetail() {
  try {
    console.log('🔍 测试教师项目详情API...');
    
    // 1. 教师登录
    console.log('1. 教师登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'teacher1763449748933@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功');
      
      // 2. 获取待审批项目
      console.log('2. 获取待审批项目...');
      const projectsResponse = await axios.get('http://localhost:3000/api/teacher/pending-projects', {
        headers: { Authorization: 'Bearer ' + token }
      });
      
      if (projectsResponse.data.success && projectsResponse.data.data.items.length > 0) {
        const projectId = projectsResponse.data.data.items[0].id;
        console.log('3. 测试教师项目详情，项目ID:', projectId);
        
        // 3. 测试新的教师项目详情端点
        const detailResponse = await axios.get('http://localhost:3000/api/projects/teacher/' + projectId, {
          headers: { Authorization: 'Bearer ' + token }
        });
        
        console.log('✅ 教师项目详情获取成功:');
        console.log(JSON.stringify(detailResponse.data, null, 2));
        
      } else {
        console.log('⚠️ 没有待审批项目');
      }
      
      // 4. 测试审批功能
      console.log('\n4. 测试审批功能...');
      
      // 测试通过审批
      try {
        const approveResponse = await axios.post(
          'http://localhost:3000/api/review/bc14260d-0281-4fdc-aa7e-46fbdf2be198/audit',
          {
            audit_result: 1 // 1 表示通过
          },
          {
            headers: { Authorization: 'Bearer ' + token }
          }
        );
        console.log('✅ 通过审批结果:', approveResponse.data);
      } catch (error) {
        console.log('❌ 通过审批失败:', error.response?.data || error.message);
      }
      
    } else {
      console.log('❌ 登录失败:', loginResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testTeacherProjectDetail();