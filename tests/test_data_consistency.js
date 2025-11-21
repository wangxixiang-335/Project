import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 测试数据一致性
async function testDataConsistency() {
  console.log('🔍 测试前后端数据一致性...\n');
  
  try {
    // 1. 教师登录
    console.log('🔑 1. 教师登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher1',
      password: '123456'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ 登录失败:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log(`✅ 登录成功: ${user.username} (ID: ${user.id})`);
    
    // 2. 测试教师个人成果
    console.log('\n📊 2. 测试教师个人成果...');
    await testTeacherPersonalProjects(token, user.id);
    
    // 3. 测试学生成果查看
    console.log('\n📊 3. 测试学生成果查看...');
    await testStudentAchievements(token);
    
    console.log('\n✅ 数据一致性测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📋 错误详情:', error.response.data);
    }
  }
}

// 测试教师个人成果
async function testTeacherPersonalProjects(token, teacherId) {
  try {
    console.log('📋 调用 /teacher/my-projects 端点...');
    const response = await axios.get(`${API_BASE}/teacher/my-projects`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 50 }
    });
    
    if (!response.data.success) {
      console.error('❌ API返回错误:', response.data.message);
      return;
    }
    
    const projects = response.data.data.items || response.data.data;
    console.log(`✅ 获取到 ${projects.length} 个教师个人成果`);
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log('\n📋 样本数据检查:');
      console.log('- ID:', project.id);
      console.log('- 标题:', project.title);
      console.log('- 状态:', project.status, '(', project.status_text, ')');
      console.log('- 类型:', project.project_type);
      console.log('- 分数:', project.score);
      console.log('- 驳回原因:', project.reject_reason);
      console.log('- 封面图:', project.cover_image);
      console.log('- 创建时间:', project.created_at);
      
      // 检查必需字段
      const requiredFields = ['id', 'title', 'status', 'project_type', 'created_at'];
      const missingFields = requiredFields.filter(field => !(field in project));
      if (missingFields.length > 0) {
        console.warn('⚠️ 缺少字段:', missingFields);
      } else {
        console.log('✅ 所有必需字段都存在');
      }
      
      // 检查状态码范围
      const validStatuses = [0, 1, 2, 3]; // 草稿/待审核/已通过/已打回
      if (!validStatuses.includes(project.status)) {
        console.warn('⚠️ 无效的状态码:', project.status);
      } else {
        console.log('✅ 状态码有效');
      }
    }
    
    // 状态分布统计
    const statusCount = {};
    projects.forEach(p => {
      const statusText = p.status_text || '未知';
      statusCount[statusText] = (statusCount[statusText] || 0) + 1;
    });
    console.log('\n📊 状态分布:', statusCount);
    
  } catch (error) {
    console.error('❌ 教师个人成果测试失败:', error.message);
    if (error.response) {
      console.error('📋 错误详情:', error.response.data);
    }
  }
}

// 测试学生成果查看
async function testStudentAchievements(token) {
  try {
    console.log('📋 调用 /teacher/student-achievements 端点...');
    const response = await axios.get(`${API_BASE}/teacher/student-achievements`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 50 }
    });
    
    if (!response.data.success) {
      console.error('❌ API返回错误:', response.data.message);
      return;
    }
    
    const projects = response.data.data.items || response.data.data;
    console.log(`✅ 获取到 ${projects.length} 个学生成果`);
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log('\n📋 样本数据检查:');
      console.log('- ID:', project.id);
      console.log('- 标题:', project.title);
      console.log('- 类型:', project.project_type);
      console.log('- 学生:', project.student_name);
      console.log('- 班级:', project.class_name);
      console.log('- 分数:', project.score);
      console.log('- 指导教师:', project.instructor_name);
      console.log('- 创建时间:', project.created_at);
      
      // 检查必需字段
      const requiredFields = ['id', 'title', 'project_type', 'student_name', 'class_name', 'created_at'];
      const missingFields = requiredFields.filter(field => !(field in project));
      if (missingFields.length > 0) {
        console.warn('⚠️ 缺少字段:', missingFields);
      } else {
        console.log('✅ 所有必需字段都存在');
      }
    }
    
    // 类型分布统计
    const typeCount = {};
    projects.forEach(p => {
      const type = p.project_type || '未分类';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    console.log('\n📊 类型分布:', typeCount);
    
    // 班级分布统计
    const classCount = {};
    projects.forEach(p => {
      const className = p.class_name || '未分类';
      classCount[className] = (classCount[className] || 0) + 1;
    });
    console.log('📊 班级分布:', classCount);
    
  } catch (error) {
    console.error('❌ 学生成果查看测试失败:', error.message);
    if (error.response) {
      console.error('📋 错误详情:', error.response.data);
    }
  }
}

// 运行测试
testDataConsistency().catch(console.error);