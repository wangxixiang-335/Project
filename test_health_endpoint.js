import axios from 'axios';

async function testHealth() {
  try {
    console.log('测试后端健康检查端点...');
    
    const response = await axios.get('http://localhost:3000/health');
    console.log('健康检查成功:', response.data);
    
    console.log('\n测试认证端点...');
    try {
      const authResponse = await axios.get('http://localhost:3000/api/auth/test');
      console.log('认证端点测试:', authResponse.data);
    } catch (error) {
      console.log('认证端点不存在，这是正常的');
    }
    
  } catch (error) {
    console.error('连接失败:', error.message);
  }
}

testHealth();