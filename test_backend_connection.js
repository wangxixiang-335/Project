import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testBackend() {
  try {
    console.log('测试后端连接...');
    
    // 测试基本连接
    const response = await axios.get(`${API_BASE}/test`, {
      timeout: 5000
    });
    
    console.log('后端连接成功:', response.data);
    
  } catch (error) {
    console.error('后端连接失败:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('后端服务器可能未启动');
    }
  }
}

testBackend();