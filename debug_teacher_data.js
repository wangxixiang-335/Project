import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 测试教师登录
async function loginAsTeacher() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher@example.com',
      password: '123456'
    });
    
    if (response.data.success) {
      console.log('✅ 教师登录成功');
      return response.data.data.token;
    } else {
      console.error('❌ 教师登录失败:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    return null;
  }
}

// 测试教师个人成果
async function testTeacherMyAchievements(token) {
  console.log('\n🧪 测试教师个人成果...');
  
  try {
    // 测试 /teacher/my-projects 端点
    console.log('📋 测试 /teacher/my-projects 端点...');
    const response = await axios.get(`${API_BASE}/teacher/my-projects`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10 }
    });
    
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      const projects = response.data.data.items || response.data.data;
      console.log(`✅ 成功获取 ${projects.length} 个教师个人成果`);
      
      if (projects.length > 0) {
        console.log('📋 第一个成果详情:', projects[0]);
        console.log('📊 状态分布:');
        const statusCount = {};
        projects.forEach(p => {
          const status = p.status_text || p.status;
          statusCount[status] = (statusCount[status] || 0) + 1;
        });
        console.log(statusCount);
      }
    } else {
      console.error('❌ 获取教师个人成果失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 测试教师个人成果失败:', error.message);
    if (error.response) {
      console.error('📋 错误响应:', error.response.data);
    }
  }
}

// 测试学生成果查看
async function testStudentAchievements(token) {
  console.log('\n🧪 测试学生成果查看...');
  
  try {
    // 测试 /teacher/student-achievements 端点
    console.log('📋 测试 /teacher/student-achievements 端点...');
    const response = await axios.get(`${API_BASE}/teacher/student-achievements`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10 }
    });
    
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      const projects = response.data.data.items || response.data.data;
      console.log(`✅ 成功获取 ${projects.length} 个学生成果`);
      
      if (projects.length > 0) {
        console.log('📋 第一个成果详情:', projects[0]);
        console.log('📊 类型分布:');
        const typeCount = {};
        projects.forEach(p => {
          const type = p.project_type || '未分类';
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
        console.log(typeCount);
      }
    } else {
      console.error('❌ 获取学生成果失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 测试学生成果查看失败:', error.message);
    if (error.response) {
      console.error('📋 错误响应:', error.response.data);
    }
  }
}

// 测试现有的成果库端点
async function testLibraryEndpoint(token) {
  console.log('\n🧪 测试现有成果库端点...');
  
  try {
    // 测试 /teacher/library 端点
    console.log('📋 测试 /teacher/library 端点...');
    const response = await axios.get(`${API_BASE}/teacher/library`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10 }
    });
    
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      const projects = response.data.data.items || response.data.data;
      console.log(`✅ 成功获取 ${projects.length} 个成果库项目`);
    } else {
      console.error('❌ 获取成果库失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 测试成果库端点失败:', error.message);
    if (error.response) {
      console.error('📋 错误响应:', error.response.data);
    }
  }
}

// 检查数据库连接
async function checkDatabaseConnection() {
  console.log('\n🔍 检查数据库连接...');
  
  try {
    // 尝试直接查询数据库状态
    const response = await axios.get(`${API_BASE}/health`);
    console.log('📊 系统状态:', response.data);
  } catch (error) {
    console.warn('⚠️ 无法获取系统状态:', error.message);
  }
}

// 主调试函数
async function runDebug() {
  console.log('🔍 开始调试教师系统数据读取问题...\n');
  
  await checkDatabaseConnection();
  
  // 教师登录
  const token = await loginAsTeacher();
  if (!token) {
    console.error('❌ 无法获取教师token，调试终止');
    return;
  }
  
  console.log(`🔑 获取到token: ${token.substring(0, 20)}...`);
  
  // 测试各个端点
  await testTeacherMyAchievements(token);
  await testStudentAchievements(token);
  await testLibraryEndpoint(token);
  
  console.log('\n✅ 调试完成！');
}

// 运行调试
runDebug().catch(console.error);