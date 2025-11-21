import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testFrontendLogin() {
  console.log('=== 测试前端登录流程 ===\n');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher1763610712207@example.com',
      password: 'password123'
    });
    
    console.log('🔍 登录响应:', {
      success: response.data.success,
      message: response.data.message,
      hasData: !!response.data.data,
      dataKeys: response.data.data ? Object.keys(response.data.data) : []
    });
    
    if (response.data.data) {
      console.log('\n🔍 尝试获取token的不同方式:');
      console.log('1. response.data.token:', response.data.token);
      console.log('2. response.data.data.token:', response.data.data.token);
      console.log('3. response.data.data.access_token:', response.data.data.access_token);
      console.log('4. response.data.data.session?.access_token:', response.data.data.session?.access_token);
      
      // 找到token并验证
      const token = response.data.data.token || 
                   response.data.data.session?.access_token || 
                   response.data.access_token;
      
      if (token) {
        console.log('\n✅ 找到token:', token.substring(0, 20) + '...');
        
        // 测试token是否有效
        console.log('\n🔍 测试token有效性...');
        try {
          const testResponse = await axios.get(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('✅ Token验证成功:', {
            success: testResponse.data.success,
            userId: testResponse.data.data?.user_id,
            role: testResponse.data.data?.user_metadata?.role
          });
        } catch (tokenError) {
          console.log('❌ Token验证失败:', tokenError.response?.data || tokenError.message);
        }
        
      } else {
        console.log('\n❌ 未找到有效的token');
      }
    }
    
  } catch (error) {
    console.log('❌ 登录失败:', error.response?.data || error.message);
  }
}

testFrontendLogin().catch(console.error);