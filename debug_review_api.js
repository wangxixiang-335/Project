import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function debugReviewAPI() {
  console.log('🔍 调试Review API...');
  
  try {
    // 1. 教师登录
    console.log('1️⃣ 教师登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: '3888952060@qq.com',
      password: 'Teacher123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    
    // 2. 测试获取待审核列表
    console.log('\n2️⃣ 测试获取待审核列表...');
    try {
      const response = await axios.get(`${API_BASE}/review/pending`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 5 }
      });
      
      console.log('✅ Review待审核列表获取成功');
      console.log('📋 数据:', response.data);
    } catch (error) {
      console.error('❌ Review待审核列表失败:');
      console.error('   状态码:', error.response?.status);
      console.error('   错误信息:', error.response?.data);
      console.error('   详细错误:', error.response?.data?.error);
    }
    
    // 3. 测试获取审核历史
    console.log('\n3️⃣ 测试获取审核历史...');
    try {
      const response = await axios.get(`${API_BASE}/review/history/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 5 }
      });
      
      console.log('✅ 审核历史获取成功');
      console.log('📋 数据:', response.data);
    } catch (error) {
      console.error('❌ 审核历史失败:');
      console.error('   状态码:', error.response?.status);
      console.error('   错误信息:', error.response?.data);
      console.error('   详细错误:', error.response?.data?.error);
    }
    
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
  }
}

debugReviewAPI();