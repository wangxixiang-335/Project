import { supabase } from './src/config/supabase.js';

async function createTestTeacher() {
  console.log('创建测试教师账号...');
  
  try {
    // 创建Supabase Auth用户
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'testteacher@example.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { 
        role: 'teacher', 
        username: 'testteacher' 
      }
    });

    if (authError) {
      console.log('创建用户失败:', authError.message);
      return;
    }

    console.log('Auth用户创建成功:', authData.user.email);

    // 创建users表记录
    const userData = {
      id: authData.user.id,
      username: 'testteacher',
      password_hash: '$2a$10$tempPasswordHash',
      role: 2, // teacher
      created_at: new Date().toISOString()
    };

    const { data: userResult, error: userError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (userError) {
      console.log('创建users记录失败:', userError.message);
    } else {
      console.log('Users记录创建成功:', userResult);
    }

    // 立即登录获取token
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'testteacher@example.com',
      password: 'password123'
    });

    if (loginError) {
      console.log('登录失败:', loginError.message);
    } else {
      console.log('登录成功! Token:', loginData.session?.access_token ? '有token' : '无token');
      
      // 测试审核
      const auditResponse = await fetch('http://localhost:3000/api/review/dc8914c5-60f2-449c-8dee-89095b02952d/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.session.access_token}`
        },
        body: JSON.stringify({
          audit_result: 1,
          reject_reason: ''
        })
      });
      
      const result = await auditResponse.json();
      console.log('审核测试结果:', auditResponse.status, result);
    }

  } catch (error) {
    console.log('创建教师失败:', error.message);
  }
}

createTestTeacher();