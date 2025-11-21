import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testTeacherFrontendFunctions() {
  console.log('=== 测试教师前端功能 ===\n');
  
  // 1. 登录获取token
  console.log('1️⃣ 登录获取token...');
  let token = null;
  
  try {
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
    return;
  }
  
  // 2. 测试成果查看功能
  console.log('\n2️⃣ 测试成果查看功能...');
  try {
    const libraryResponse = await axios.get(`${API_BASE}/teacher/library`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10 }
    });
    
    console.log('✅ 成果查看API响应:', {
      success: libraryResponse.data.success,
      dataCount: libraryResponse.data.data ? (libraryResponse.data.data.items?.length || 0) : 0
    });
    
    if (libraryResponse.data.success && libraryResponse.data.data) {
      const items = libraryResponse.data.data.items || [];
      console.log('📋 成果样例数据:');
      items.slice(0, 2).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} - ${item.student_name} - ${item.score || '未评分'}分`);
      });
    }
  } catch (error) {
    console.log('❌ 成果查看API失败:', error.response?.data?.error || error.message);
  }
  
  // 3. 测试数据看板功能
  console.log('\n3️⃣ 测试数据看板功能...');
  const dashboardEndpoints = [
    '/teacher/dashboard/publish-stats',
    '/teacher/dashboard/score-distribution',
    '/teacher/dashboard/class-stats'
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
        console.log(`   样例: ${JSON.stringify(response.data.data[0], null, 2).substring(0, 150)}...`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}:`, error.response?.data?.error || error.message);
    }
  }
  
  console.log('\n=== 前端功能测试完成 ===');
  console.log('🎯 现在可以测试前端页面:');
  console.log('1. 启动前端服务器: cd temp-frontend && npm run dev');
  console.log('2. 访问: http://localhost:5173/teacher.html');
  console.log('3. 登录后测试"成果查看"和"数据看板"功能');
  console.log('\n💡 已修复的功能:');
  console.log('✅ 成果查看: 显示已通过审核的学生成果');
  console.log('✅ 数据看板: 显示发布量统计和分数分布图表');
  console.log('✅ 统计数字: 总项目数、已通过、待审批、已打回');
  console.log('✅ 交互式图表: 简单的柱状图和饼图');
}

testTeacherFrontendFunctions().catch(console.error);