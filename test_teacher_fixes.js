import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

// 测试数据
const testTeacherToken = 'dev-teacher-token';

async function testTeacherAPIs() {
  console.log('🧪 测试教师API修复...\n');

  try {
    // 1. 测试教师个人成果API
    console.log('1️⃣ 测试教师个人成果API...');
    const myProjectsResponse = await axios.get(`${API_BASE}/teacher/my-projects`, {
      headers: { Authorization: `Bearer ${testTeacherToken}` },
      params: { page: 1, pageSize: 10 }
    });
    
    console.log('✅ 教师个人成果API响应:', {
      success: myProjectsResponse.data.success,
      dataCount: myProjectsResponse.data.data?.items?.length || myProjectsResponse.data.data?.length || 0,
      message: myProjectsResponse.data.message
    });

    // 2. 测试学生成果查看API
    console.log('\n2️⃣ 测试学生成果查看API...');
    const studentAchievementsResponse = await axios.get(`${API_BASE}/teacher/student-achievements`, {
      headers: { Authorization: `Bearer ${testTeacherToken}` },
      params: { page: 1, pageSize: 10 }
    });
    
    console.log('✅ 学生成果查看API响应:', {
      success: studentAchievementsResponse.data.success,
      dataCount: studentAchievementsResponse.data.data?.items?.length || studentAchievementsResponse.data.data?.length || 0,
      message: studentAchievementsResponse.data.message
    });

    // 3. 显示详细数据
    if (myProjectsResponse.data.success) {
      const projects = myProjectsResponse.data.data?.items || myProjectsResponse.data.data || [];
      console.log('\n📋 教师个人成果详情:');
      projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.title} (状态: ${project.status}, 类型: ${project.project_type})`);
      });
    }

    if (studentAchievementsResponse.data.success) {
      const projects = studentAchievementsResponse.data.data?.items || studentAchievementsResponse.data.data || [];
      console.log('\n📋 学生成果详情:');
      projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.title} - ${project.student_name} (状态: ${project.status}, 类型: ${project.project_type})`);
      });
    }

  } catch (error) {
    console.error('❌ API测试失败:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      console.log('💡 提示: 可能是认证问题，请检查教师token是否正确');
    }
  }
}

testTeacherAPIs();