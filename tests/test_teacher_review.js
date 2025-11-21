const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 测试教师登录获取token
async function testTeacherLogin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher@example.com',
      password: 'password123'
    });
    
    if (response.data.success) {
      return response.data.data.token;
    }
  } catch (error) {
    console.error('教师登录失败:', error.response?.data || error.message);
  }
  return null;
}

// 测试获取待审核项目
async function testPendingProjects(token) {
  try {
    const response = await axios.get(`${API_BASE}/review/pending`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 50 }
    });
    
    console.log('待审核项目API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取待审核项目失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试项目评审功能
async function testProjectReview(token, projectId) {
  try {
    const response = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
      audit_result: 1, // 通过
      reject_reason: null
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('项目评审API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('项目评审失败:', error.response?.data || error.message);
    return null;
  }
}

// 主测试函数
async function testTeacherReview() {
  console.log('=== 开始测试教师项目评审功能 ===');
  
  // 1. 登录获取token
  console.log('\n1. 教师登录...');
  const token = await testTeacherLogin();
  if (!token) {
    console.error('❌ 教师登录失败，无法继续测试');
    return;
  }
  console.log('✅ 教师登录成功，token获取成功');
  
  // 2. 测试获取待审核项目
  console.log('\n2. 测试获取待审核项目...');
  const pendingResult = await testPendingProjects(token);
  if (pendingResult?.success) {
    console.log('✅ 获取待审核项目成功');
    console.log(`   待审核项目数量: ${pendingResult.data.total || 0}`);
    
    if (pendingResult.data.items && pendingResult.data.items.length > 0) {
      const projectId = pendingResult.data.items[0].project_id;
      console.log(`   找到项目ID: ${projectId}`);
      
      // 3. 测试项目评审
      console.log('\n3. 测试项目评审...');
      const reviewResult = await testProjectReview(token, projectId);
      if (reviewResult?.success) {
        console.log('✅ 项目评审成功');
      } else {
        console.log('❌ 项目评审失败');
      }
    } else {
      console.log('⚠️ 没有找到待审核项目，跳过评审测试');
    }
  } else {
    console.log('❌ 获取待审核项目失败');
  }
  
  console.log('\n=== 测试完成 ===');
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:3000/health', { timeout: 5000 });
    console.log('✅ 服务器运行正常');
    return true;
  } catch (error) {
    console.log('❌ 服务器未运行或不可访问');
    return false;
  }
}

// 运行测试
async function runTest() {
  console.log('检查服务器状态...');
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await testTeacherReview();
  } else {
    console.log('请先启动服务器: node src/app.js');
  }
}

runTest();