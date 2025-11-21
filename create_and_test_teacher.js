import { supabaseAdmin } from './src/config/supabase.js';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function createAndTestTeacher() {
  console.log('👨‍🏫 创建并测试教师账号...');
  
  const teacherEmail = `teacher${Date.now()}@example.com`;
  const teacherPassword = 'password123';
  const teacherUsername = `teacher${Date.now()}`;
  
  try {
    // 1. 在Supabase Auth中创建教师
    console.log('\n1️⃣ 在Supabase Auth中创建教师...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: teacherEmail,
      password: teacherPassword,
      email_confirm: true,
      user_metadata: { 
        role: 'teacher',
        username: teacherUsername
      }
    });
    
    if (authError) {
      console.error('❌ 创建Auth教师失败:', authError);
      return;
    }
    
    console.log('✅ Auth教师创建成功:', authUser.user.id);
    
    // 2. 在users表中创建记录
    console.log('\n2️⃣ 在users表中创建记录...');
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        username: teacherUsername,
        password_hash: '$2a$10$tempPasswordHash',
        role: 2, // 2 = teacher (根据users.js中的映射)
        created_at: new Date().toISOString()
      });
    
    if (userError) {
      console.log('⚠️ users表记录创建失败:', userError.message);
    } else {
      console.log('✅ users表记录创建成功');
    }
    
    // 3. 测试登录
    console.log('\n3️⃣ 测试教师登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: teacherEmail,
      password: teacherPassword
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功');
      console.log('   账号信息:');
      console.log('   - 邮箱:', teacherEmail);
      console.log('   - 密码:', teacherPassword);
      console.log('   - 角色:', loginResponse.data.data.role);
      console.log('   - 用户名:', loginResponse.data.data.username);
      
      // 4. 创建测试学生和项目
      console.log('\n4️⃣ 创建测试学生和项目...');
      await createTestStudentAndProject();
      
      // 5. 测试评审功能
      console.log('\n5️⃣ 测试评审功能...');
      await testReviewFeatures(token);
      
      console.log('\n🎉 测试完成！可以使用以下账号登录:');
      console.log('邮箱:', teacherEmail);
      console.log('密码:', teacherPassword);
      
    } else {
      console.error('❌ 登录失败:', loginResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ 创建教师过程出错:', error);
  }
}

// 创建测试学生和项目
async function createTestStudentAndProject() {
  const studentEmail = `student${Date.now()}@example.com`;
  const studentPassword = 'password123';
  const studentUsername = `student${Date.now()}`;
  
  try {
    // 创建学生
    const { data: studentAuth } = await supabaseAdmin.auth.admin.createUser({
      email: studentEmail,
      password: studentPassword,
      email_confirm: true,
      user_metadata: { 
        role: 'student',
        username: studentUsername
      }
    });
    
    if (studentAuth) {
      // 在users表中创建学生记录
      await supabaseAdmin
        .from('users')
        .insert({
          id: studentAuth.user.id,
          username: studentUsername,
          password_hash: '$2a$10$tempPasswordHash',
          role: 1, // 1 = student
          created_at: new Date().toISOString()
        });
      
      // 创建测试项目
      const { data: project } = await supabaseAdmin
        .from('achievements')
        .insert({
          publisher_id: studentAuth.user.id,
          title: '测试项目 - 教师评审测试',
          description: `
            <h2>项目概述</h2>
            <p>这是一个用于测试教师评审功能的项目。</p>
            <h3>技术栈</h3>
            <ul>
              <li>前端: React + TypeScript</li>
              <li>后端: Node.js + Express</li>
              <li>数据库: PostgreSQL</li>
            </ul>
            <h3>功能特点</h3>
            <p>1. 用户认证和授权</p>
            <p>2. 项目提交和评审</p>
            <p>3. 实时通知系统</p>
          `,
          type_id: '00000000-0000-0000-0000-000000000000',
          status: 1, // 待审核
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      console.log('✅ 测试项目创建成功:', project.id);
    }
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  }
}

// 测试评审功能
async function testReviewFeatures(token) {
  try {
    // 获取待审核项目
    const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10 }
    });
    
    console.log('✅ 获取待审核项目成功');
    console.log('   项目数量:', pendingResponse.data.data.items.length);
    
    if (pendingResponse.data.data.items.length > 0) {
      const project = pendingResponse.data.data.items[0];
      console.log('   第一个项目:', {
        id: project.project_id,
        title: project.title,
        student: project.student_name
      });
      
      // 测试通过操作
      console.log('\n🟢 测试通过操作...');
      try {
        const approveResponse = await axios.post(`${API_BASE}/review/${project.project_id}/audit`, {
          audit_result: 1,
          reject_reason: null // 使用null而不是空字符串
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ 通过操作成功:', approveResponse.data.message);
      } catch (approveError) {
        console.error('❌ 通过操作失败:');
        console.error('   错误:', approveError.response?.data);
        
        if (approveError.response?.data?.error === '参数验证失败') {
          console.log('🔍 尝试不同的参数组合...');
          
          // 尝试不带reject_reason
          try {
            const response2 = await axios.post(`${API_BASE}/review/${project.project_id}/audit`, {
              audit_result: 1
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ 通过操作成功(无reject_reason):', response2.data.message);
          } catch (error2) {
            console.error('❌ 仍然失败:', error2.response?.data);
          }
        }
      }
      
      // 重置项目状态并测试打回
      await supabaseAdmin
        .from('achievements')
        .update({ status: 1 })
        .eq('id', project.project_id);
      
      console.log('\n🔴 测试打回操作...');
      try {
        const rejectResponse = await axios.post(`${API_BASE}/review/${project.project_id}/audit`, {
          audit_result: 2,
          reject_reason: '项目内容需要进一步完善，请补充更多技术细节和实际应用案例。'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ 打回操作成功:', rejectResponse.data.message);
      } catch (rejectError) {
        console.error('❌ 打回操作失败:', rejectError.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ 评审功能测试失败:', error);
  }
}

createAndTestTeacher();