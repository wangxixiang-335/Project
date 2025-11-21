import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testCompleteFlow() {
  try {
    console.log('🚀 开始完整测试流程...');
    
    // 1. 测试服务器连接
    console.log('\n1️⃣ 测试服务器连接...');
    try {
      const response = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ 服务器连接正常');
    } catch (error) {
      console.log('⚠️  服务器可能没有health端点，继续测试...');
    }
    
    // 2. 登录获取token
    console.log('\n2️⃣ 尝试登录教师账号...');
    
    // 尝试不同的登录方式
    let token = null;
    
    // 方式1：使用email
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'teacher1@example.com',
        password: 'password123'
      });
      token = loginResponse.data.token;
      console.log('✅ 使用email登录成功');
    } catch (error) {
      console.log('❌ email登录失败:', error.response?.data || error.message);
      
      // 方式2：使用username
      try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'teacher1',  // 可能使用username
          password: 'password123'
        });
        token = loginResponse.data.token;
        console.log('✅ 使用username登录成功');
      } catch (error2) {
        console.log('❌ username登录也失败:', error2.response?.data || error2.message);
        return;
      }
    }
    
    if (!token) {
      console.log('❌ 无法获取token，测试终止');
      return;
    }
    
    console.log('🔑 获得token:', token.substring(0, 20) + '...');
    
    // 3. 测试获取待审核列表
    console.log('\n3️⃣ 获取待审核列表...');
    try {
      const pendingResponse = await axios.get(`${BASE_URL}/api/review/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ 获取待审核列表成功，项目数:', pendingResponse.data.data?.length || 0);
      
      if (pendingResponse.data.data?.length > 0) {
        const firstProject = pendingResponse.data.data[0];
        console.log('📋 第一个项目:', {
          id: firstProject.project_id,
          title: firstProject.title
        });
        
        // 4. 测试审核功能
        console.log('\n4️⃣ 测试审核功能...');
        try {
          const auditResponse = await axios.post(
            `${BASE_URL}/api/review/${firstProject.project_id}/audit`,
            {
              audit_result: 1, // 通过
              reject_reason: ''
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );
          console.log('✅ 审核成功:', auditResponse.data);
        } catch (auditError) {
          console.log('❌ 审核失败:', {
            status: auditError.response?.status,
            data: auditError.response?.data,
            message: auditError.message
          });
        }
      }
    } catch (pendingError) {
      console.log('❌ 获取待审核列表失败:', {
        status: pendingError.response?.status,
        data: pendingError.response?.data,
        message: pendingError.message
      });
    }
    
    console.log('\n🏁 测试完成！');
    
  } catch (error) {
    console.log('💥 测试过程出错:', error.message);
  }
}

testCompleteFlow();