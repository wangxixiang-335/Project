import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 使用数据库中的真实用户进行测试
async function loginWithRealUser() {
  console.log('🔑 使用数据库中的真实用户登录...');
  
  const testUsers = [
    { email: 'teacher1', password: '123456' },
    { email: 'student1', password: '123456' }
  ];
  
  for (const user of testUsers) {
    try {
      console.log(`🔄 尝试登录: ${user.email}`);
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: user.email,
        password: user.password
      });
      
      if (response.data.success) {
        console.log(`✅ ${user.email} 登录成功`);
        console.log(`📋 用户信息:`, response.data.data.user);
        return response.data.data.token;
      }
    } catch (error) {
      console.log(`❌ ${user.email} 登录失败:`, error.message);
    }
  }
  
  return null;
}

// 测试教师个人成果 - 使用正确的端点
async function testTeacherPersonalProjects(token) {
  console.log('\n🧪 测试教师个人成果...');
  
  try {
    console.log('📋 调用 /teacher/my-projects 端点...');
    const response = await axios.get(`${API_BASE}/teacher/my-projects`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 20 }
    });
    
    console.log('📊 响应状态:', response.status);
    console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      const projects = response.data.data.items || response.data.data;
      console.log(`✅ 成功获取 ${projects.length} 个教师个人成果`);
      
      // 分析数据格式
      if (projects.length > 0) {
        const project = projects[0];
        console.log('\n📋 第一个成果的数据结构:');
        console.log('- ID:', project.id);
        console.log('- 标题:', project.title);
        console.log('- 状态:', project.status, '/', project.status_text);
        console.log('- 创建时间:', project.created_at);
        console.log('- 封面图:', project.cover_image);
        console.log('- 所有字段:', Object.keys(project));
      }
    } else {
      console.error('❌ API返回错误:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📋 错误详情:', error.response.data);
    }
  }
}

// 测试成果库 - 查看所有已通过成果
async function testLibrary(token) {
  console.log('\n🧪 测试成果库...');
  
  try {
    console.log('📋 调用 /teacher/library 端点...');
    const response = await axios.get(`${API_BASE}/teacher/library`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 20 }
    });
    
    console.log('📊 响应状态:', response.status);
    
    if (response.data.success) {
      const projects = response.data.data.items || response.data.data;
      console.log(`✅ 成功获取 ${projects.length} 个成果库项目`);
      
      // 分析数据格式
      if (projects.length > 0) {
        const project = projects[0];
        console.log('\n📋 第一个成果的数据结构:');
        console.log('- ID:', project.id);
        console.log('- 标题:', project.title);
        console.log('- 学生姓名:', project.student_name);
        console.log('- 分数:', project.score);
        console.log('- 类型:', project.project_type);
        console.log('- 班级:', project.class_name);
        console.log('- 所有字段:', Object.keys(project));
      }
    } else {
      console.error('❌ API返回错误:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📋 错误详情:', error.response.data);
    }
  }
}

// 测试新的学生成果端点
async function testStudentAchievementsNew(token) {
  console.log('\n🧪 测试新的学生成果端点...');
  
  try {
    console.log('📋 调用 /teacher/student-achievements 端点...');
    const response = await axios.get(`${API_BASE}/teacher/student-achievements`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 20 }
    });
    
    console.log('📊 响应状态:', response.status);
    
    if (response.data.success) {
      const projects = response.data.data.items || response.data.data;
      console.log(`✅ 成功获取 ${projects.length} 个学生成果`);
      
      // 分析数据格式
      if (projects.length > 0) {
        const project = projects[0];
        console.log('\n📋 第一个成果的数据结构:');
        console.log('- ID:', project.id);
        console.log('- 标题:', project.title);
        console.log('- 类型:', project.project_type);
        console.log('- 学生:', project.student_name);
        console.log('- 班级:', project.class_name);
        console.log('- 分数:', project.score);
        console.log('- 指导教师:', project.instructor_name);
        console.log('- 所有字段:', Object.keys(project));
      }
    } else {
      console.error('❌ API返回错误:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📋 错误详情:', error.response.data);
    }
  }
}

// 检查所有可用的API端点
async function checkAvailableEndpoints() {
  console.log('\n🔍 检查可用的API端点...');
  
  const endpoints = [
    '/auth/login',
    '/teacher/my-projects',
    '/teacher/projects',
    '/teacher/library',
    '/teacher/student-achievements'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_BASE}${endpoint}`, {
        validateStatus: (status) => true // 接受所有状态码
      });
      
      if (response.status === 404) {
        console.log(`❌ ${endpoint} - 不存在`);
      } else if (response.status === 401) {
        console.log(`✅ ${endpoint} - 存在（需要认证）`);
      } else {
        console.log(`✅ ${endpoint} - 存在（状态:${response.status}）`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - 错误:`, error.message);
    }
  }
}

// 主验证函数
async function runVerification() {
  console.log('🔍 开始验证教师系统API...\n');
  
  await checkAvailableEndpoints();
  
  // 尝试登录
  const token = await loginWithRealUser();
  if (!token) {
    console.error('\n❌ 无法获取认证token，验证终止');
    return;
  }
  
  console.log('\n✅ 登录成功，开始测试API功能...');
  
  // 测试各个端点
  await testTeacherPersonalProjects(token);
  await testLibrary(token);
  await testStudentAchievementsNew(token);
  
  console.log('\n✅ API验证完成！');
}

// 运行验证
runVerification().catch(console.error);