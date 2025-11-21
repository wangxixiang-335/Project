import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function debugSpecificReviewError() {
  console.log('🔍 调试具体的评审错误...');
  
  const teacherEmail = 'teacher1763449748933@example.com';
  const teacherPassword = 'password123';
  
  try {
    // 登录获取token
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: teacherEmail,
      password: teacherPassword
    });
    
    const token = loginResponse.data.data.token;
    const projectId = 'bc14260d-0281-4fdc-aa7e-46fbdf2be198'; // 测试项目ID
    
    console.log('✅ 登录成功，测试项目ID:', projectId);
    
    // 测试不同的请求方式
    console.log('\n🧪 测试不同的请求参数...');
    
    const testCases = [
      {
        name: '最小参数',
        data: { audit_result: 1 }
      },
      {
        name: '带reject_reason=null',
        data: { audit_result: 1, reject_reason: null }
      },
      {
        name: '带reject_reason=""',
        data: { audit_result: 1, reject_reason: '' }
      },
      {
        name: '打回参数',
        data: { audit_result: 2, reject_reason: '测试打回原因' }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📋 测试: ${testCase.name}`);
      console.log('   参数:', testCase.data);
      
      try {
        const response = await axios.post(`${API_BASE}/review/${projectId}/audit`, testCase.data, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: function (status) {
            return status < 500; // 只有5xx错误才算真正的错误
          }
        });
        
        if (response.data.success) {
          console.log('✅ 成功:', response.data.message);
        } else {
          console.log('❌ 业务错误:', response.data.error);
          console.log('   详细:', response.data.details);
        }
      } catch (error) {
        console.log('❌ 请求错误:');
        console.log('   状态码:', error.response?.status);
        console.log('   错误:', error.response?.data);
        
        // 如果是500错误，查看错误堆栈
        if (error.response?.status === 500) {
          console.log('   服务器错误详情:', error.response?.data?.stack);
        }
      }
    }
    
    // 检查项目是否真的存在且状态正确
    console.log('\n🔍 检查项目状态...');
    try {
      const projectCheck = await axios.get(`${API_BASE}/review/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ 项目详情:', projectCheck.data.data?.title || '无法获取');
      console.log('   状态:', projectCheck.data.data?.status || '未知');
    } catch (checkError) {
      console.error('❌ 获取项目详情失败:', checkError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ 调试过程出错:', error);
  }
}

debugSpecificReviewError();