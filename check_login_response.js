import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function checkLoginResponse() {
  console.log('=== 检查登录响应详情 ===\n');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher1763610712207@example.com',
      password: 'password123'
    });
    
    console.log('🔍 完整登录响应:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n🔍 响应结构分析:');
    console.log('- success:', response.data.success);
    console.log('- message:', response.data.message);
    console.log('- data存在:', !!response.data.data);
    
    if (response.data.data) {
      console.log('- data结构:');
      Object.keys(response.data.data).forEach(key => {
        console.log(`  - ${key}:`, typeof response.data.data[key] === 'object' ? 
          JSON.stringify(response.data.data[key]) : response.data.data[key]);
      });
    }
    
    console.log('\n🔍 token检查:');
    console.log('- data.token:', response.data.data?.token);
    console.log('- 直接token:', response.data.token);
    
  } catch (error) {
    console.log('❌ 登录请求失败:', error.response?.data || error.message);
  }
}

checkLoginResponse().catch(console.error);