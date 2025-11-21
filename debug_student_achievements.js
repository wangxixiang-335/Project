import axios from 'axios';

async function debugStudentAchievements() {
  const API_BASE = 'http://localhost:3000/api';
  
  // 测试token - 使用实际的教师token
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM3NTM0NzQ2LCJpYXQiOjE3Mzc1MzExNDYsImlzcyI6Imh0dHBzOi8vZWlqeGlhdW9yaXd5bGNjcXdxenNweXcuc3VwYWJhc2UuY28iLCJzdWIiOiJhZDYyZjJmYS0wNGM4LTQzN2ItYTI3ZC0xMmY2YmFhNzUwYjEiLCJlbWFpbCI6InRlc3R0ZWFjaGVyMTIzQGV4YW1wbGUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInJvbGUiOiJ0ZWFjaGVyIn0sInVzZXJfbWV0YWRhdGEiOnsicm9sZSI6InRlYWNoZXIiLCJmdWxsX25hbWUiOiLmtYvor5XnmoTmg4Xml7YifX0.YN2tPXWR9sInFw_xn_1QMq2HvxCt_KV9t2Inl9cC9NU';
  
  try {
    console.log('🧪 开始测试 /teacher/student-achievements API...');
    
    // 测试1: 不带token
    console.log('\n📋 测试1: 无token访问');
    try {
      const response1 = await axios.get(`${API_BASE}/teacher/student-achievements`, {
        params: { page: 1, pageSize: 10 }
      });
      console.log('✅ 无token访问成功:', response1.status);
    } catch (error) {
      console.log('❌ 无token访问失败:', error.response?.status, error.response?.data);
    }
    
    // 测试2: 带token但参数不正确
    console.log('\n📋 测试2: 带token但无分页参数');
    try {
      const response2 = await axios.get(`${API_BASE}/teacher/student-achievements`, {
        headers: { Authorization: `Bearer ${testToken}` }
      });
      console.log('✅ 无分页参数访问成功:', response2.status);
    } catch (error) {
      console.log('❌ 无分页参数访问失败:', error.response?.status, error.response?.data);
    }
    
    // 测试3: 正确的请求
    console.log('\n📋 测试3: 完整正确的请求');
    try {
      const response3 = await axios.get(`${API_BASE}/teacher/student-achievements`, {
        headers: { Authorization: `Bearer ${testToken}` },
        params: { 
          page: 1, 
          pageSize: 10 
        }
      });
      console.log('✅ 完整请求成功:', response3.status);
      console.log('📋 返回数据:', response3.data);
    } catch (error) {
      console.log('❌ 完整请求失败:', error.response?.status);
      console.log('📋 错误详情:', error.response?.data);
      console.log('📋 请求头:', error.config?.headers);
      console.log('📋 请求参数:', error.config?.params);
    }
    
    // 测试4: 验证token有效性
    console.log('\n📋 测试4: 验证token有效性');
    try {
      const response4 = await axios.get(`${API_BASE}/teacher/profile`, {
        headers: { Authorization: `Bearer ${testToken}` }
      });
      console.log('✅ Token有效:', response4.status);
      console.log('📋 用户信息:', response4.data);
    } catch (error) {
      console.log('❌ Token无效:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('🔥 调试过程中发生错误:', error.message);
  }
}

// 运行调试
debugStudentAchievements();