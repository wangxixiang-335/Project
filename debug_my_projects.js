import axios from 'axios';

async function debugMyProjects() {
  try {
    console.log('🔑 教师登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'teacher1763449748933@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功');
      console.log('👤 用户ID:', loginResponse.data.data.user_id);
      
      // 添加详细的请求调试
      console.log('\n🔄 测试 /teacher/my-projects 带详细调试...');
      try {
        const response = await axios.get('http://localhost:3000/api/teacher/my-projects?page=1&pageSize=10', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ 请求成功');
        console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('❌ 请求失败');
        if (error.response) {
          console.error('📊 状态码:', error.response.status);
          console.error('📋 错误响应:', JSON.stringify(error.response.data, null, 2));
          console.error('🔍 请求头:', error.config.headers);
          console.error('📍 请求URL:', error.config.url);
          
          // 尝试获取更详细的错误信息
          if (error.response.data.error === '获取项目列表失败') {
            console.log('\n🔍 这个错误来自后端catch块，可能是数据库查询错误');
          }
        } else if (error.request) {
          console.error('📤 请求已发送但没有响应:', error.request);
        } else {
          console.error('❌ 请求配置错误:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

debugMyProjects();