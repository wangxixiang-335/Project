import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testTeacherFunctions() {
  console.log('=== 测试教师功能API ===\n');
  
  // 1. 先登录获取token
  console.log('1️⃣ 登录获取token...');
  let token = null;
  
  try {
    // 尝试使用一个简单的教师账号
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      token = loginResponse.data.data.token;
      console.log('✅ 登录成功，获取到token:', token.substring(0, 20) + '...');
    } else {
      console.log('❌ 登录失败:', loginResponse.data.error);
      return;
    }
  } catch (error) {
    console.log('❌ 登录异常:', error.response?.data?.error || error.message);
    console.log('💡 可能需要先创建教师账号');
    
    // 尝试创建测试教师账号
    console.log('\n🔧 尝试创建测试教师账号...');
    try {
      const createResponse = await axios.post(`${API_BASE}/auth/register`, {
        email: 'teacher@example.com',
        password: 'password123',
        username: 'teacher',
        role: 'teacher'
      });
      
      if (createResponse.data.success) {
        console.log('✅ 教师账号创建成功，请重新登录');
        return;
      }
    } catch (createError) {
      console.log('❌ 创建账号失败:', createError.response?.data?.error || createError.message);
    }
    return;
  }
  
  // 2. 测试成果查看功能API
  console.log('\n2️⃣ 测试成果查看API...');
  try {
    const libraryResponse = await axios.get(`${API_BASE}/teacher/student-achievements`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10 }
    });
    
    console.log('✅ 成果库API响应:', {
      success: libraryResponse.data.success,
      dataCount: libraryResponse.data.data ? (Array.isArray(libraryResponse.data.data) ? libraryResponse.data.data.length : libraryResponse.data.data.items?.length || 0) : 0
    });
    
    if (libraryResponse.data.success && libraryResponse.data.data) {
      const items = Array.isArray(libraryResponse.data.data) ? libraryResponse.data.data : libraryResponse.data.data.items || [];
      console.log('📋 成果样例数据:');
      items.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} - ${item.student_name} - 状态:${item.status}`);
      });
    }
  } catch (error) {
    console.log('❌ 成果库API失败:', error.response?.data?.error || error.message);
  }
  
  // 3. 测试数据看板API
  console.log('\n3️⃣ 测试数据看板API...');
  
  const dashboardEndpoints = [
    '/teacher/dashboard/publish-stats',
    '/teacher/dashboard/score-distribution', 
    '/teacher/dashboard/class-stats',
    '/teacher/dashboard/recent-activities'
  ];
  
  for (const endpoint of dashboardEndpoints) {
    try {
      const response = await axios.get(`${API_BASE}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ ${endpoint}:`, {
        success: response.data.success,
        dataCount: Array.isArray(response.data.data) ? response.data.data.length : 'N/A'
      });
      
      if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        console.log(`   样例: ${JSON.stringify(response.data.data[0], null, 2).substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}:`, error.response?.data?.error || error.message);
    }
  }
  
  console.log('\n=== API测试完成 ===');
  console.log('💡 如果API测试通过，问题可能在于:');
  console.log('1. 前端组件的数据处理逻辑');
  console.log('2. 用户登录状态检查');
  console.log('3. Token存储和获取');
  console.log('4. 组件渲染逻辑');
}

testTeacherFunctions().catch(console.error);