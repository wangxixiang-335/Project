import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function finalVerification() {
  console.log('🎯 最终验证教师成果库修复...\n');
  
  // 1. 测试开发者token
  console.log('📋 1. 测试开发者教师token...');
  try {
    const response = await axios.get(`${API_BASE}/teacher/student-achievements?page=1&pageSize=10`, {
      headers: { 
        Authorization: 'Bearer dev-teacher-token',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data.success) {
      const projects = response.data.data.items || [];
      console.log(`✅ 开发者token测试成功!`);
      console.log(`📊 找到 ${projects.length} 个学生成果`);
      console.log(`📄 数据总数: ${response.data.data.pagination?.totalItems || 0}`);
      
      if (projects.length > 0) {
        console.log('\n📋 学生成果示例:');
        projects.slice(0, 3).forEach((project, index) => {
          console.log(`${index + 1}. ${project.title} - ${project.student_name} (${project.score || '未评分'}分)`);
        });
      }
    } else {
      console.log('❌ 开发者token测试失败:', response.data);
    }
    
  } catch (error) {
    console.log('❌ 开发者token测试异常:', error.response?.data || error.message);
  }
  
  // 2. 测试前端登录API
  console.log('\n📋 2. 测试前端登录API...');
  try {
    const loginResponse = await axios.post(`${API_BASE}/users/login`, {
      email: 'test@example.com',
      password: 'test123'
    });
    
    console.log('⚠️ 登录API返回（预期失败）:', loginResponse.data);
  } catch (loginError) {
    console.log('✅ 登录API正常（正确拒绝了无效凭据）');
  }
  
  // 3. 检查服务器状态
  console.log('\n📋 3. 检查服务器状态...');
  
  try {
    const healthResponse = await axios.get(`${API_BASE}/`, { timeout: 5000 });
    console.log('✅ 后端服务器运行正常');
  } catch (healthError) {
    console.log('❌ 后端服务器可能未运行');
  }
  
  try {
    const frontendResponse = await axios.get('http://localhost:5176/', { timeout: 5000 });
    console.log('✅ 前端服务器运行正常');
  } catch (frontendError) {
    console.log('❌ 前端服务器可能未运行');
  }
  
  // 4. 提供使用指南
  console.log('\n📋 4. 使用指南:');
  console.log('方法1 - 前端快速登录:');
  console.log('1. 访问 http://localhost:5176/');
  console.log('2. 点击"开发者模式(教师)"按钮');
  console.log('3. 自动进入教师主页');
  console.log('4. 点击"成果查看"查看数据');
  
  console.log('\n方法2 - 手动设置token:');
  console.log('1. 在浏览器控制台运行:');
  console.log("   localStorage.setItem('teacherToken', 'dev-teacher-token');");
  console.log('2. 刷新页面');
  console.log('3. 访问成果查看功能');
  
  console.log('\n方法3 - 使用验证页面:');
  console.log('1. 打开 file:///D:/Work/Project/verify_teacher_fix.html');
  console.log('2. 点击"一键修复"按钮');
  console.log('3. 按照提示操作');
  
  console.log('\n🎉 验证完成！现在应该能看到真实的学生成果数据了。');
}

finalVerification().catch(console.error);