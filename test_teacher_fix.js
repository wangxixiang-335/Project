import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 测试教师登录获取token
async function testTeacherLogin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: '3888952060@qq.com',
      password: 'Teacher123!'
    });
    
    if (response.data.success) {
      console.log('✅ 教师登录成功');
      return response.data.data.token;
    }
  } catch (error) {
    console.error('❌ 教师登录失败:', error.response?.data || error.message);
  }
  return null;
}

// 测试获取所有项目
async function testAllProjects(token) {
  try {
    const response = await axios.get(`${API_BASE}/teacher/projects`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10 }
    });
    
    console.log('✅ 获取所有项目成功');
    console.log('📊 项目数量:', response.data.data.total);
    console.log('📋 项目列表:', response.data.data.items.map(item => ({
      id: item.project_id,
      title: item.title,
      student: item.student_name,
      status: item.status_text
    })));
    return response.data.data.items;
  } catch (error) {
    console.error('❌ 获取所有项目失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试获取待审核项目
async function testPendingProjects(token) {
  try {
    const response = await axios.get(`${API_BASE}/teacher/pending-projects`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10 }
    });
    
    console.log('✅ 获取待审核项目成功');
    console.log('📊 待审核项目数量:', response.data.data.total);
    console.log('📋 待审核项目列表:', response.data.data.items.map(item => ({
      id: item.project_id,
      title: item.title,
      student: item.student_name,
      submitted_at: item.submitted_at
    })));
    return response.data.data.items;
  } catch (error) {
    console.error('❌ 获取待审核项目失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试获取统计信息
async function testTeacherStats(token) {
  try {
    const response = await axios.get(`${API_BASE}/teacher/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ 获取统计信息成功');
    console.log('📈 统计数据:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ 获取统计信息失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试评审相关API
async function testReviewAPIs(token) {
  try {
    // 获取待审核列表（review端点）
    const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 5 }
    });
    
    console.log('✅ Review端待审核列表获取成功');
    console.log('📋 Review待审核项目:', pendingResponse.data.data.items.map(item => ({
      id: item.project_id,
      title: item.title,
      student: item.student_name
    })));

    // 获取审核历史
    const historyResponse = await axios.get(`${API_BASE}/review/history/list`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 5 }
    });
    
    console.log('✅ 审核历史获取成功');
    console.log('📜 审核历史:', historyResponse.data.data.items.map(item => ({
      id: item.project_id,
      title: item.title,
      status: item.status,
      auditor: item.auditor_name
    })));

    return pendingResponse.data.data.items;
  } catch (error) {
    console.error('❌ Review API测试失败:', error.response?.data || error.message);
    return null;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试教师端项目功能修复...\n');
  
  // 1. 教师登录
  const token = await testTeacherLogin();
  if (!token) {
    console.log('🛑 测试终止：无法获取教师token');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 2. 获取统计信息
  await testTeacherStats(token);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 3. 获取所有项目
  await testAllProjects(token);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 4. 获取待审核项目
  const pendingProjects = await testPendingProjects(token);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 5. 测试Review API
  await testReviewAPIs(token);
  
  console.log('\n' + '='.repeat(50) + '\n');
  console.log('✅ 所有测试完成！');
}

// 运行测试
runTests().catch(console.error);