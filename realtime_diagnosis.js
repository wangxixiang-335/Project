import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 实时诊断函数
async function realtimeDiagnosis() {
  console.log('🔍 实时诊断前后端数据不一致问题...\n');
  
  try {
    // 1. 首先直接查询数据库获取真实数据
    console.log('📊 第一步：查询数据库真实数据');
    await checkDatabaseData();
    
    // 2. 测试API返回的数据
    console.log('\n📊 第二步：测试API返回数据');
    await checkAPIResponse();
    
    // 3. 对比数据差异
    console.log('\n📊 第三步：对比数据差异');
    await compareData();
    
  } catch (error) {
    console.error('❌ 诊断失败:', error.message);
  }
}

// 检查数据库中的真实数据
async function checkDatabaseData() {
  try {
    // 查询教师个人成果
    console.log('📋 查询教师个人成果数据...');
    const { data: teacherAchievements, error: teacherError } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        status,
        publisher_id,
        instructor_id,
        created_at,
        users:publisher_id (id, username, role)
      `)
      .eq('publisher_id', '58517efa-e7c3-4cca-8d83-4648d0bcf6aa') // teacher1
      .order('created_at', { ascending: false });
    
    if (teacherError) {
      console.error('❌ 查询教师成果失败:', teacherError);
    } else {
      console.log(`✅ 数据库中教师个人成果: ${teacherAchievements?.length || 0} 条`);
      if (teacherAchievements && teacherAchievements.length > 0) {
        console.log('📋 样本数据:', teacherAchievements[0]);
      }
    }
    
    // 查询所有学生成果
    console.log('\n📋 查询所有学生成果数据...');
    const { data: studentAchievements, error: studentError } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        status,
        type_id,
        score,
        publisher_id,
        instructor_id,
        created_at,
        users:publisher_id (id, username, role, class_id),
        classes:class_id (id, name, grade_id),
        grades:grade_id (id, name),
        achievement_types:type_id (id, name)
      `)
      .neq('status', 0) // 排除草稿
      .order('created_at', { ascending: false });
    
    if (studentError) {
      console.error('❌ 查询学生成果失败:', studentError);
    } else {
      console.log(`✅ 数据库中学生成果: ${studentAchievements?.length || 0} 条`);
      if (studentAchievements && studentAchievements.length > 0) {
        console.log('📋 样本数据:', studentAchievements[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ 数据库查询失败:', error);
  }
}

// 检查API响应数据
async function checkAPIResponse() {
  try {
    // 使用之前验证过的token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ODUxN2VmYS1lN2MzLTRjY2EtOGQ4My00NjQ4ZDBiY2Y2YWEiLCJyb2xlIjoyLCJpYXQiOjE3MzIwOTU2MjMsImV4cCI6MTczMjE4MjAyM30.TlZ7xP1Xv9cK3mR8sL5qN2oW6eY9rA4bD7gH0jK8fM1';
    
    // 测试教师个人成果API
    console.log('📋 测试教师个人成果API...');
    const teacherResponse = await axios.get(`${API_BASE}/teacher/my-projects`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 50 }
    });
    
    console.log('📊 API响应状态:', teacherResponse.status);
    if (teacherResponse.data.success) {
      const projects = teacherResponse.data.data.items || teacherResponse.data.data;
      console.log(`✅ API返回教师成果: ${projects.length} 条`);
      if (projects.length > 0) {
        console.log('📋 API样本数据:', projects[0]);
      }
    }
    
    // 测试学生成果API
    console.log('\n📋 测试学生成果API...');
    const studentResponse = await axios.get(`${API_BASE}/teacher/student-achievements`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 50 }
    });
    
    console.log('📊 API响应状态:', studentResponse.status);
    if (studentResponse.data.success) {
      const projects = studentResponse.data.data.items || studentResponse.data.data;
      console.log(`✅ API返回学生成果: ${projects.length} 条`);
      if (projects.length > 0) {
        console.log('📋 API样本数据:', projects[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('📋 错误响应:', error.response.data);
    }
  }
}

// 对比数据差异
async function compareData() {
  console.log('\n📊 数据对比分析:');
  console.log('请手动对比上述数据库和API返回的数据差异');
  console.log('主要检查点:');
  console.log('1. ✅ 数据条数是否一致');
  console.log('2. ✅ 状态码映射是否正确');
  console.log('3. ✅ 字段名称是否匹配');
  console.log('4. ✅ 数据格式是否一致');
  console.log('5. ✅ 关联数据是否正确');
}

// 检查前端控制台日志
function checkFrontendConsole() {
  console.log('\n🔍 前端控制台检查建议:');
  console.log('1. 打开浏览器开发者工具 (F12)');
  console.log('2. 查看Console选项卡中的日志输出');
  console.log('3. 查看Network选项卡中的API请求');
  console.log('4. 对比前端显示的数据与API响应数据');
}

// 运行诊断
realtimeDiagnosis().then(() => {
  checkFrontendConsole();
  console.log('\n📋 诊断完成，请根据以上信息分析问题所在');
}).catch(console.error);