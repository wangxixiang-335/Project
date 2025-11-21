import { supabase, supabaseAdmin } from './src/config/supabase.js';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function fixTeacherReviewComplete() {
  console.log('🔧 完整修复教师评审问题...');
  
  try {
    // 1. 在Supabase Auth中创建教师用户
    console.log('\n1️⃣ 在Supabase Auth中创建教师用户...');
    const teacherEmail = 'teacher@example.com';
    const teacherPassword = 'password123';
    
    try {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: teacherEmail,
        password: teacherPassword,
        email_confirm: true,
        user_metadata: { 
          role: 'teacher',
          username: 'testteacher'
        }
      });
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log('✅ 教师用户已存在，跳过创建');
        } else {
          console.error('❌ 创建Auth用户失败:', authError);
          return;
        }
      } else {
        console.log('✅ Auth教师用户创建成功:', authUser.user.id);
        
        // 2. 在users表中同步创建记录
        console.log('\n2️⃣ 在users表中同步创建记录...');
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authUser.user.id,
            username: 'testteacher',
            password_hash: '$2a$10$tempPasswordHash',
            role: 2, // 2 = teacher (根据users.js中的逻辑)
            created_at: new Date().toISOString()
          });
        
        if (userError) {
          console.log('⚠️ users表记录可能已存在:', userError.message);
        } else {
          console.log('✅ users表记录创建成功');
        }
      }
    } catch (error) {
      console.error('❌ Auth创建异常:', error);
    }
    
    // 3. 测试登录
    console.log('\n3️⃣ 测试教师登录...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: teacherEmail,
        password: teacherPassword
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.token;
        console.log('✅ 教师登录成功');
        console.log('   用户信息:', {
          user_id: loginResponse.data.data.user_id,
          username: loginResponse.data.data.username,
          role: loginResponse.data.data.role
        });
        
        // 4. 测试获取待审核项目
        console.log('\n4️⃣ 测试获取待审核项目...');
        try {
          const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: 1, pageSize: 10 }
          });
          
          console.log('✅ 获取待审核项目成功');
          console.log('   总数:', pendingResponse.data.data.total);
          console.log('   项目数:', pendingResponse.data.data.items.length);
          
          if (pendingResponse.data.data.items.length > 0) {
            const projectId = pendingResponse.data.data.items[0].project_id;
            console.log('   第一个项目ID:', projectId);
            
            // 5. 测试审核操作
            await testAuditOperations(token, projectId);
          } else {
            console.log('⚠️ 没有待审核项目，创建测试项目...');
            await createTestStudentAndProject(token);
          }
        } catch (pendingError) {
          console.error('❌ 获取待审核项目失败:', pendingError.response?.data);
        }
      }
    } catch (loginError) {
      console.error('❌ 登录失败:', loginError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error);
  }
}

// 测试审核操作
async function testAuditOperations(token, projectId) {
  console.log('\n5️⃣ 测试审核操作...');
  
  // 5.1 测试通过操作
  console.log('5.1 测试通过操作...');
  try {
    const approveResponse = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
      audit_result: 1, // 通过
      reject_reason: '' // 通过时不需要原因
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ 通过操作成功:', approveResponse.data);
  } catch (approveError) {
    console.error('❌ 通过操作失败:', approveError.response?.data);
    
    if (approveError.response?.data?.error === '参数验证失败') {
      console.log('🔍 分析验证失败原因...');
      console.log('   - audit_result: 1 (应该是有效的)');
      console.log('   - reject_reason: "" (通过时应该是可选的)');
    }
  }
  
  // 5.2 测试打回操作 (需要先将项目状态重置为待审核)
  console.log('5.2 重置项目状态并测试打回操作...');
  try {
    // 重置项目状态为待审核
    await supabase
      .from('achievements')
      .update({ status: 1 })
      .eq('id', projectId);
    
    const rejectResponse = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
      audit_result: 2, // 打回
      reject_reason: '项目内容不够完善，请补充更多细节' // 打回时必填原因
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ 打回操作成功:', rejectResponse.data);
  } catch (rejectError) {
    console.error('❌ 打回操作失败:', rejectError.response?.data);
  }
}

// 创建测试学生和项目
async function createTestStudentAndProject(teacherToken) {
  console.log('\n6️⃣ 创建测试学生和项目...');
  
  try {
    // 创建学生用户
    const studentEmail = 'student@example.com';
    const studentPassword = 'password123';
    
    const { data: studentAuth, error: studentError } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: studentPassword,
      email_confirm: true,
      user_metadata: { 
        role: 'student',
        username: 'teststudent'
      }
    });
    
    if (studentError && !studentError.message.includes('already registered')) {
      console.error('❌ 创建学生用户失败:', studentError);
      return;
    }
    
    const studentId = studentAuth?.user?.id;
    if (studentId) {
      // 在users表中创建学生记录
      await supabase
        .from('users')
        .upsert({
          id: studentId,
          username: 'teststudent',
          password_hash: '$2a$10$tempPasswordHash',
          role: 1, // 1 = student
          created_at: new Date().toISOString()
        });
      
      console.log('✅ 学生用户创建成功');
    }
    
    // 获取学生ID (如果已存在)
    let finalStudentId = studentId;
    if (!studentId) {
      const { data: existingStudent } = await supabase.auth.signInWithPassword({
        email: studentEmail,
        password: studentPassword
      });
      finalStudentId = existingStudent.user?.id;
    }
    
    if (finalStudentId) {
      // 创建测试项目
      const { data: project } = await supabase
        .from('achievements')
        .insert({
          publisher_id: finalStudentId,
          title: '测试项目 - ' + new Date().getTime(),
          description: '<p>这是一个测试项目的详细内容，包含了丰富的信息和技术细节。</p>',
          type_id: '00000000-0000-0000-0000-000000000000',
          status: 1, // 待审核
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      console.log('✅ 测试项目创建成功:', project.id);
      
      // 重新测试审核
      await testAuditOperations(teacherToken, project.id);
    }
    
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  }
}

// 分析参数验证问题
function analyzeValidationIssue() {
  console.log('\n🔍 参数验证问题分析:');
  console.log('根据validation.js中的auditSchema:');
  console.log('- audit_result: 必须是 1(通过) 或 2(打回)');
  console.log('- reject_reason: 当audit_result=2时必填，当audit_result=1时可选');
  console.log('- 前端传递的参数需要符合这个规则');
}

fixTeacherReviewComplete();