import axios from 'axios';

async function debugReviewDetailed() {
  try {
    console.log('🔍 详细调试审批功能...');
    
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
        console.log('3. 项目ID:', projectId);
        
        // 3. 检查项目当前状态
        console.log('4. 检查项目当前状态...');
        const detailResponse = await axios.get('http://localhost:3000/api/projects/teacher/' + projectId, {
          headers: { Authorization: 'Bearer ' + token }
        });
        
        console.log('项目状态:', detailResponse.data.data.status);
        
        // 4. 测试审批 - 通过
        console.log('5. 测试通过审批...');
        try {
          const approveResponse = await axios.post(
            `http://localhost:3000/api/review/${projectId}/audit`,
            {
              audit_result: 1
            },
            {
              headers: { 
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log('✅ 通过审批成功:', approveResponse.data);
        } catch (error) {
          console.log('❌ 通过审批失败:', error.response?.data || error.message);
          console.log('状态码:', error.response?.status);
          console.log('请求URL:', `http://localhost:3000/api/review/${projectId}/audit`);
          console.log('请求数据:', { audit_result: 1 });
        }
        
        // 5. 测试审批 - 驳回
        console.log('\n6. 测试驳回审批...');
        try {
          const rejectResponse = await axios.post(
            `http://localhost:3000/api/review/${projectId}/audit`,
            {
              audit_result: 2,
              reject_reason: '内容不够详细，请补充更多说明'
            },
            {
              headers: { 
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log('✅ 驳回审批成功:', rejectResponse.data);
        } catch (error) {
          console.log('❌ 驳回审批失败:', error.response?.data || error.message);
        }
        
      } else {
        console.log('⚠️ 没有待审批项目');
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

debugReviewDetailed();