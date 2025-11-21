import axios from 'axios';

async function testAuditAPI() {
  try {
    console.log('🧪 测试审核API...');
    
    const projectId = 'dc8914c5-60f2-449c-8dee-89095b02952d';
    
    // 测试审核通过
    const auditData = {
      audit_result: 1, // 1 = 通过
      reject_reason: ''
    };
    
    console.log('📤 发送审核请求:', {
      url: `http://localhost:3000/api/review/${projectId}/audit`,
      data: auditData
    });
    
    const response = await axios.post(
      `http://localhost:3000/api/review/${projectId}/audit`,
      auditData,
      {
        headers: {
          'Content-Type': 'application/json',
          // 注意：这里需要真实的认证token，暂时用于测试
          // 'Authorization': 'Bearer your-token-here'
        }
      }
    );
    
    console.log('✅ 审核请求成功:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ 审核请求失败:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.log('❌ 网络错误:', error.message);
    }
  }
}

testAuditAPI();