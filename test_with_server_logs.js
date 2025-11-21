import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testWithServerLogs() {
  console.log('🔍 测试评审功能并查看服务器日志...');
  
  const teacherEmail = 'teacher1763449748933@example.com';
  const teacherPassword = 'password123';
  
  try {
    // 登录
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: teacherEmail,
      password: teacherPassword
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      
      // 获取项目
      const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 10 }
      });
      
      if (pendingResponse.data.success && pendingResponse.data.data.items.length > 0) {
        const project = pendingResponse.data.data.items[0];
        
        console.log('\n🧪 测试通过操作...');
        console.log('📋 请查看服务器控制台输出，寻找详细的错误信息');
        
        // 执行审核操作
        try {
          const response = await axios.post(`${API_BASE}/review/${project.project_id}/audit`, {
            audit_result: 1
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('✅ 成功:', response.data);
        } catch (error) {
          console.log('❌ 失败:', error.response?.data);
        }
      }
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testWithServerLogs();