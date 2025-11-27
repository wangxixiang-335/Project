import axios from 'axios';

async function testConnection() {
  try {
    console.log('🔍 测试后端连接...');
    
    // 测试健康检查
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ 健康检查:', healthResponse.data);
    
    // 测试教师个人成果API
    const myProjectsResponse = await axios.get('http://localhost:3000/api/teacher/my-projects', {
      headers: { Authorization: 'Bearer dev-teacher-token' }
    });
    console.log('✅ 教师个人成果API响应:', {
      success: myProjectsResponse.data.success,
      count: myProjectsResponse.data.data?.items?.length || 0
    });
    
    // 测试学生成果查看API (带status参数)
    const studentAchievementsResponse = await axios.get('http://localhost:3000/api/teacher/student-achievements?page=1&pageSize=10&status=2', {
      headers: { Authorization: 'Bearer dev-teacher-token' }
    });
    console.log('✅ 学生成果查看API响应:', {
      success: studentAchievementsResponse.data.success,
      count: studentAchievementsResponse.data.data?.items?.length || 0
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testConnection();