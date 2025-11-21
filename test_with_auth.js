import axios from 'axios';

async function loginAndAudit() {
  try {
    console.log('🔐 登录获取token...');
    
    // 1. 先登录教师账号
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'teacher1@example.com', // 根据用户表，这是teacher1账号
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功，获得token:', token ? '有token' : '无token');
    
    // 2. 测试审核API
    const projectId = 'dc8914c5-60f2-449c-8dee-89095b02952d';
    const auditData = {
      audit_result: 1, // 1 = 通过
      reject_reason: ''
    };
    
    console.log('📤 发送审核请求...');
    
    const auditResponse = await axios.post(
      `http://localhost:3000/api/review/${projectId}/audit`,
      auditData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ 审核请求成功:', auditResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ 请求失败:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.log('❌ 网络错误:', error.message);
    }
  }
}

loginAndAudit();