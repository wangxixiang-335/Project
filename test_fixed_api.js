import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 测试教师登录获取token
async function testTeacherLogin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher1763610712207@example.com',
      password: 'password123'
    });
    
    console.log('🔍 登录响应数据:', response.data);
    if (response.data.success) {
      console.log('✅ 教师登录成功');
      console.log('🔍 Token位置检查:', {
        token: response.data.token,
        data_token: response.data.data?.token,
        access_token: response.data.access_token
      });
      return response.data.data.token || response.data.token || response.data.access_token;
    } else {
      console.log('❌ 教师登录失败:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error.message);
    return null;
  }
}

// 测试学生成果API
async function testStudentAchievements(token) {
  try {
    const response = await axios.get(`${API_BASE}/teacher/student-achievements`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 100 }
    });
    
    console.log('📚 学生成果API响应状态:', response.status);
    console.log('📚 学生成果API成功:', response.data.success);
    
    if (response.data.success && response.data.data) {
      const items = response.data.data.items || response.data.data;
      console.log(`📊 获取到 ${items.length} 个学生成果`);
      
      if (items.length > 0) {
        console.log('📋 前3个成果:');
        items.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.title} - 学生: ${item.student_name} - 状态: ${item.status}`);
        });
      }
    }
    
    return response.data;
  } catch (error) {
    console.log('❌ 学生成果API调用失败:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return null;
  }
}

// 测试成果库API
async function testLibraryAPI(token) {
  try {
    const response = await axios.get(`${API_BASE}/teacher/library`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 100 }
    });
    
    console.log('📚 成果库API响应状态:', response.status);
    console.log('📚 成果库API成功:', response.data.success);
    
    if (response.data.success && response.data.data) {
      const items = response.data.data.items || response.data.data;
      console.log(`📊 获取到 ${items.length} 个成果库项目`);
    }
    
    return response.data;
  } catch (error) {
    console.log('❌ 成果库API调用失败:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return null;
  }
}

// 主测试函数
async function runTests() {
  console.log('=== 测试修复后的API调用 ===\n');
  
  // 1. 测试教师登录
  console.log('1️⃣ 测试教师登录...');
  const token = await testTeacherLogin();
  
  if (!token) {
    console.log('\n❌ 无法获取token，跳过后续测试');
    return;
  }
  
  console.log(`✅ 获取到token: ${token.substring(0, 20)}...\n`);
  
  // 2. 测试学生成果API
  console.log('2️⃣ 测试学生成果API...');
  await testStudentAchievements(token);
  console.log();
  
  // 3. 测试成果库API
  console.log('3️⃣ 测试成果库API...');
  await testLibraryAPI(token);
  console.log();
  
  console.log('=== 测试完成 ===');
  console.log('🎯 如果API调用成功，前端页面应该能正常显示数据');
  console.log('🌐 请访问: http://localhost:5173');
  console.log('🔑 使用教师账号登录: teacher1763610712207@example.com / password123');
}

// 运行测试
runTests().catch(console.error);