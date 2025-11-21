import axios from 'axios';

async function debug400Error() {
  try {
    console.log('=== 调试400错误 ===\n');
    
    const API_BASE = 'http://localhost:8090';
    
    // 测试1: 直接无参数请求
    console.log('🔍 测试1: 无参数请求');
    try {
      const response = await axios.get(`${API_BASE}/api/teacher/student-achievements`, {
        timeout: 5000
      });
      console.log('✅ 无参数请求成功');
    } catch (error) {
      console.error('❌ 无参数请求失败:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
    
    // 测试2: 带参数请求（前端实际使用的方式）
    console.log('\n🔍 测试2: 带参数请求');
    try {
      const response = await axios.get(`${API_BASE}/api/teacher/student-achievements`, {
        params: { 
          page: 1, 
          pageSize: 100 
        },
        timeout: 5000
      });
      console.log('✅ 带参数请求成功');
      console.log('📋 响应数据:', response.data);
    } catch (error) {
      console.error('❌ 带参数请求失败:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: `${API_BASE}/api/teacher/student-achievements`
      });
    }
    
    // 测试3: 测试不同的URL格式
    console.log('\n🔍 测试3: 不同URL格式');
    const urls = [
      `${API_BASE}/api/teacher/student-achievements`,
      `${API_BASE}/teacher/student-achievements`,
      `http://localhost:8090/api/teacher/student-achievements`
    ];
    
    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          params: { page: 1, pageSize: 10 },
          timeout: 3000
        });
        console.log(`✅ URL成功: ${url}`);
        break;
      } catch (error) {
        console.log(`❌ URL失败: ${url}`);
        console.log(`   状态: ${error.response?.status}`);
        if (error.response?.status !== 401) { // 401是认证错误，我们关心的是其他400错误
          console.log(`   数据: ${JSON.stringify(error.response?.data)}`);
        }
      }
    }
    
    // 测试4: 检查验证中间件
    console.log('\n🔍 测试4: 检查验证中间件');
    try {
      const response = await axios.get(`${API_BASE}/api/teacher/student-achievements`, {
        params: { page: 1, pageSize: 10 },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        timeout: 3000
      });
      console.log('✅ 带验证头请求成功');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('📝 400错误详细分析:');
        console.log('   状态:', error.response.status);
        console.log('   数据:', error.response.data);
        console.log('   可能原因:');
        console.log('   1. 验证中间件问题');
        console.log('   2. 参数验证失败');
        console.log('   3. 路由配置问题');
        console.log('   4. 请求格式问题');
      } else {
        console.log(`其他错误: ${error.response?.status} - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debug400Error();