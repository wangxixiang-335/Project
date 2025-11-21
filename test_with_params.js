import axios from 'axios';

async function testWithParams() {
  try {
    console.log('🔑 教师登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'teacher1763449748933@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功');
      
      // 测试带参数的请求
      console.log('\n🔄 测试 /teacher/my-projects 带分页参数...');
      try {
        const response = await axios.get('http://localhost:3000/api/teacher/my-projects?page=1&pageSize=10', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ 带参数请求成功:', response.data.message);
        console.log('📊 项目数量:', response.data.data?.items?.length || 0);
      } catch (error) {
        console.error('❌ 带参数请求失败:', error.response?.status, error.response?.statusText);
        console.error('📋 错误详情:', error.response?.data);
      }
      
      // 测试不带参数的请求（应该失败）
      console.log('\n🔄 测试 /teacher/my-projects 不带参数...');
      try {
        const response = await axios.get('http://localhost:3000/api/teacher/my-projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ 无参数请求成功:', response.data.message);
      } catch (error) {
        console.error('❌ 无参数请求失败:', error.response?.status, error.response?.statusText);
        console.error('📋 错误详情:', error.response?.data);
        if (error.response?.status === 400) {
          console.log('🎯 确认: 400错误是由于缺少分页参数');
        }
      }
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testWithParams();