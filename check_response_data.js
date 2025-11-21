import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function checkResponseData() {
  try {
    console.log('🔍 检查API响应数据详情...');
    
    const response = await axios.get(`${API_BASE}/teacher/student-achievements?page=1&pageSize=10`, {
      headers: { 
        Authorization: 'Bearer dev-teacher-token',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ API调用成功!');
    console.log('📋 状态码:', response.status);
    console.log('📋 完整响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 分析数据结构
    if (response.data.success) {
      console.log('\n🔍 数据结构分析:');
      console.log('success:', response.data.success);
      console.log('message:', response.data.message);
      console.log('data type:', typeof response.data.data);
      console.log('data keys:', response.data.data ? Object.keys(response.data.data) : 'null');
      
      if (response.data.data && response.data.data.items) {
        console.log('items count:', response.data.data.items.length);
        console.log('first item:', JSON.stringify(response.data.data.items[0], null, 2));
      }
      
      if (response.data.data && response.data.data.pagination) {
        console.log('pagination:', response.data.data.pagination);
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.response?.data || error.message);
  }
}

checkResponseData();