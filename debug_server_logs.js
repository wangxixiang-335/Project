import axios from 'axios';

async function debugServerLogs() {
  try {
    console.log('🔍 调试服务器日志...');
    
    // 1. 教师登录
    console.log('1. 教师登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'teacher1763449748933@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功');
      
      // 2. 检查数据库结构
      console.log('2. 检查数据库结构...');
      
      // 检查achievements表
      try {
        const achievementsCheck = await axios.get('http://localhost:3000/api/teacher/pending-projects', {
          headers: { Authorization: 'Bearer ' + token }
        });
        console.log('✅ achievements表正常，待审批项目:', achievementsCheck.data.data.items.length);
      } catch (error) {
        console.log('❌ achievements表错误:', error.response?.data || error.message);
      }
      
      // 3. 检查approval_records表
      try {
        const approvalCheck = await axios.get('http://localhost:3000/api/review/history/list', {
          headers: { Authorization: 'Bearer ' + token }
        });
        console.log('✅ approval_records表正常，历史记录:', approvalCheck.data.data.items.length);
      } catch (error) {
        console.log('❌ approval_records表错误:', error.response?.data || error.message);
      }
      
      // 4. 测试简单的状态更新
      if (loginResponse.data.success) {
        const projectId = 'bc14260d-0281-4fdc-aa7e-46fbdf2be198';
        console.log('5. 测试项目状态更新...');
        
        // 先获取当前状态
        const currentResponse = await axios.get(`http://localhost:3000/api/projects/teacher/${projectId}`, {
          headers: { Authorization: 'Bearer ' + token }
        });
        
        console.log('当前项目状态:', currentResponse.data.data.status);
        console.log('当前审批记录:', currentResponse.data.data.latest_review);
        
        // 5. 测试审批API的详细错误
        console.log('6. 测试审批API详细错误...');
        try {
          const auditResponse = await axios.post(
            `http://localhost:3000/api/review/${projectId}/audit`,
            {
              audit_result: 1
            },
            {
              headers: { 
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
              },
              validateStatus: function (status) {
                return status >= 200 && status < 600; // 接受所有状态码
              }
            }
          );
          
          console.log('审批响应状态:', auditResponse.status);
          console.log('审批响应数据:', auditResponse.data);
          
          if (auditResponse.status === 400) {
            console.log('详细错误信息:', JSON.stringify(auditResponse.data, null, 2));
          }
          
        } catch (error) {
          console.log('请求错误:', error.message);
          if (error.response) {
            console.log('错误状态码:', error.response.status);
            console.log('错误数据:', error.response.data);
          }
        }
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

debugServerLogs();