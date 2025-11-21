import { supabase } from './src/config/supabase.js';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function deepDebugReviewOperations() {
  console.log('🔍 深度调试评审操作问题...');
  
  const teacherEmail = 'teacher1763449748933@example.com';
  const teacherPassword = 'password123';
  
  try {
    // 1. 登录获取token
    console.log('\n1️⃣ 教师登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: teacherEmail,
      password: teacherPassword
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ 登录失败:', loginResponse.data.error);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    
    // 2. 获取待审核项目
    console.log('\n2️⃣ 获取待审核项目...');
    const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10 }
    });
    
    if (!pendingResponse.data.success || pendingResponse.data.data.items.length === 0) {
      console.log('⚠️ 没有待审核项目');
      return;
    }
    
    const project = pendingResponse.data.data.items[0];
    console.log('✅ 找到待审核项目:', {
      id: project.project_id,
      title: project.title,
      student: project.student_name
    });
    
    // 3. 直接测试数据库操作
    console.log('\n3️⃣ 直接测试数据库操作...');
    await testDirectDatabaseOperations(project.project_id);
    
    // 4. 逐步模拟API调用
    console.log('\n4️⃣ 逐步模拟API调用...');
    await simulateAPICall(token, project.project_id);
    
    // 5. 检查项目状态变化
    console.log('\n5️⃣ 检查项目状态变化...');
    await checkProjectStatusChange(project.project_id);
    
  } catch (error) {
    console.error('❌ 调试过程出错:', error);
  }
}

// 直接测试数据库操作
async function testDirectDatabaseOperations(projectId) {
  console.log('🔧 直接测试数据库操作...');
  
  try {
    // 获取当前项目状态
    const { data: currentProject, error: fetchError } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (fetchError) {
      console.error('❌ 获取项目失败:', fetchError);
      return;
    }
    
    console.log('📋 当前项目状态:', {
      id: currentProject.id,
      title: currentProject.title,
      status: currentProject.status,
      description_length: currentProject.description?.length || 0
    });
    
    // 测试简单的状态更新
    console.log('\n🟢 测试通过操作(数据库层)...');
    const { data: approvedProject, error: approveError } = await supabase
      .from('achievements')
      .update({ 
        status: 2 
      })
      .eq('id', projectId)
      .select()
      .single();
    
    if (approveError) {
      console.error('❌ 数据库通过操作失败:', {
        code: approveError.code,
        message: approveError.message,
        details: approveError.details,
        hint: approveError.hint
      });
    } else {
      console.log('✅ 数据库通过操作成功:', {
        id: approvedProject.id,
        new_status: approvedProject.status
      });
    }
    
    // 重置状态
    await supabase
      .from('achievements')
      .update({ status: 1 })
      .eq('id', projectId);
    
    // 测试打回操作
    console.log('\n🔴 测试打回操作(数据库层)...');
    const rejectReason = '测试打回原因';
    const { data: rejectedProject, error: rejectError } = await supabase
      .from('achievements')
      .update({ 
        status: 3,
        description: currentProject.description + `\n\n--- 审核打回原因 ---\n${rejectReason}`
      })
      .eq('id', projectId)
      .select()
      .single();
    
    if (rejectError) {
      console.error('❌ 数据库打回操作失败:', {
        code: rejectError.code,
        message: rejectError.message,
        details: rejectError.details,
        hint: rejectError.hint
      });
    } else {
      console.log('✅ 数据库打回操作成功:', {
        id: rejectedProject.id,
        new_status: rejectedProject.status,
        description_updated: rejectedProject.description?.includes('审核打回原因')
      });
    }
    
    // 重置为原始状态
    await supabase
      .from('achievements')
      .update({ 
        status: 1,
        description: currentProject.description
      })
      .eq('id', projectId);
    
  } catch (error) {
    console.error('❌ 数据库测试异常:', error);
  }
}

// 模拟API调用
async function simulateAPICall(token, projectId) {
  console.log('🔄 模拟API调用...');
  
  // 检查具体的API错误
  console.log('\n📡 测试API调用详情...');
  
  try {
    const response = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
      audit_result: 1
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // 捕获更详细的错误信息
      validateStatus: function (status) {
        return true; // 接受所有状态码
      }
    });
    
    console.log('📡 API响应状态:', response.status);
    console.log('📡 API响应数据:', response.data);
    
    if (response.status >= 400) {
      console.log('❌ API调用失败:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
    }
    
  } catch (error) {
    console.error('❌ API调用异常:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response'
    });
  }
}

// 检查项目状态变化
async function checkProjectStatusChange(projectId) {
  console.log('📊 检查项目状态变化...');
  
  const { data: projectHistory, error: historyError } = await supabase
    .from('achievements')
    .select('id, title, status, created_at')
    .eq('id', projectId)
    .single();
  
  if (historyError) {
    console.error('❌ 获取项目历史失败:', historyError);
  } else {
    console.log('📊 当前项目状态:', {
      id: projectHistory.id,
      title: projectHistory.title,
      status: projectHistory.status,
      status_text: projectHistory.status === 1 ? '待审核' : 
                 projectHistory.status === 2 ? '已通过' : 
                 projectHistory.status === 3 ? '已打回' : '未知',
      created_at: projectHistory.created_at
    });
  }
}

deepDebugReviewOperations();