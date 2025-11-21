import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testFixedAuth() {
  try {
    console.log('🧪 测试修复后的认证系统...');
    
    // 1. 测试开发者教师token
    console.log('\n👨‍🏫 测试开发者教师token...');
    try {
      const response = await axios.get(`${API_BASE}/teacher/student-achievements?page=1&pageSize=10`, {
        headers: { 
          Authorization: 'Bearer dev-teacher-token',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ 开发者教师token成功!');
      console.log('📋 状态码:', response.status);
      console.log('📋 返回数据结构:', {
        success: response.data.success,
        data_count: Array.isArray(response.data.data) ? response.data.data.length : 'N/A',
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.pageSize
      });
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        console.log('📋 第一个学生成果示例:', {
          id: response.data.data[0].id,
          title: response.data.data[0].title,
          student_name: response.data.data[0].student_name,
          score: response.data.data[0].score
        });
      }
      
    } catch (error) {
      console.error('❌ 开发者教师token失败:', error.response?.data || error.message);
    }
    
    // 2. 测试其他教师API端点
    console.log('\n📚 测试其他教师API端点...');
    const teacherEndpoints = [
      '/teacher/profile',
      '/teacher/projects',
      '/teacher/pending-projects'
    ];
    
    for (const endpoint of teacherEndpoints) {
      try {
        const response = await axios.get(`${API_BASE}${endpoint}`, {
          headers: { Authorization: 'Bearer dev-teacher-token' },
          timeout: 5000
        });
        console.log(`✅ ${endpoint}: ${response.status} - 成功`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      }
    }
    
    // 3. 测试学生token
    console.log('\n🎓 测试开发者学生token...');
    try {
      const response = await axios.get(`${API_BASE}/projects`, {
        headers: { Authorization: 'Bearer dev-student-token' },
        timeout: 5000
      });
      console.log('✅ 开发者学生token成功!');
      console.log('📋 状态码:', response.status);
    } catch (error) {
      console.log('❌ 开发者学生token失败:', error.response?.status);
    }
    
    // 4. 测试权限验证
    console.log('\n🔒 测试权限验证...');
    try {
      // 尝试用学生token访问教师API
      const response = await axios.get(`${API_BASE}/teacher/student-achievements`, {
        headers: { Authorization: 'Bearer dev-student-token' },
        timeout: 5000
      });
      console.log('⚠️ 学生token访问教师API意外成功（可能权限检查有问题）');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ 权限验证正常工作：学生无法访问教师API');
      } else {
        console.log('❌ 权限验证异常:', error.response?.status);
      }
    }
    
    // 5. 提供前端使用指南
    console.log('\n📋 前端使用指南:');
    console.log('1. 在浏览器控制台中设置教师token:');
    console.log("   localStorage.setItem('teacherToken', 'dev-teacher-token');");
    console.log('2. 刷新页面或重新访问教师成果库');
    console.log('3. 现在应该能看到真实的学生成果数据');
    
    console.log('\n🔗 便捷链接:');
    console.log('- 前端: http://localhost:5176/');
    console.log('- 测试页面: file:///D:/Work/Project/teacher_test_fixed.html');
    
  } catch (error) {
    console.error('🔥 测试过程中发生错误:', error);
  }
}

testFixedAuth();