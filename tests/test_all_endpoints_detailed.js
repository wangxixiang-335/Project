import axios from 'axios';

async function testAllEndpointsDetailed() {
  try {
    console.log('🔑 教师登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'teacher1763449748933@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功');
      
      // 测试前端使用的所有端点
      const apiEndpoints = [
        '/teacher/my-projects',
        '/teacher/projects', 
        '/projects',
        '/achievements'
      ];
      
      let lastError = null;
      
      for (let i = 0; i < apiEndpoints.length; i++) {
        const endpoint = apiEndpoints[i];
        console.log(`\n🔄 测试端点 ${i + 1}/${apiEndpoints.length}: ${endpoint}`);
        
        try {
          const response = await axios.get(`http://localhost:3000/api${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log(`✅ ${endpoint}: ${response.status} - 成功`);
          
          // 如果成功，检查数据格式
          if (response.data.success) {
            if (Array.isArray(response.data.data)) {
              console.log(`📊 数据格式: 直接数组, 项目数: ${response.data.data.length}`);
            } else if (response.data.data && response.data.data.items && Array.isArray(response.data.data.items)) {
              console.log(`📊 数据格式: 分页格式, 项目数: ${response.data.data.items.length}`);
            }
          }
          
          // 成功就跳出循环（模拟前端行为）
          console.log('🎯 此端点成功，前端应该使用这个');
          break;
          
        } catch (error) {
          if (error.response) {
            console.error(`❌ ${endpoint}: ${error.response.status} - ${error.response.statusText}`);
            lastError = error; // 保存最后一个错误
            
            if (error.response.status === 404) {
              console.error(`🎯 发现404错误！这个可能是前端显示的错误`);
            } else if (error.response.status === 400) {
              console.error(`⚠️  400错误（参数错误）`);
            }
          } else {
            console.error(`❌ ${endpoint}: ${error.message}`);
            lastError = error;
          }
          
          // 继续尝试下一个端点
          if (i < apiEndpoints.length - 1) {
            console.log('🔄 继续尝试下一个端点...');
          }
        }
      }
      
      // 显示最后的错误（这就是前端显示的错误）
      console.log('\n🎯 前端应该显示的错误:');
      if (lastError) {
        if (lastError.response && lastError.response.status === 404) {
          console.error(`❌ 获取项目列表失败: Request failed with status code 404`);
        } else if (lastError.response && lastError.response.status === 400) {
          console.error(`⚠️  获取项目列表失败: Request failed with status code 400`);
        } else {
          console.error(`❌ 获取项目列表失败: ${lastError.message}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAllEndpointsDetailed();