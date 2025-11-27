// 测试用户注册功能
import { supabaseAdmin } from './src/config/supabase.js';

async function testRegistration() {
  console.log('=== 测试用户注册 ===');
  
  try {
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      username: `testuser${Date.now()}`,
      role: 'student'
    };
    
    console.log('尝试创建用户:', testUser.email);
    
    // 尝试创建Supabase Auth用户
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: { role: testUser.role, username: testUser.username }
    });

    if (authError) {
      console.error('❌ 创建用户失败:', authError);
      console.log('错误代码:', authError.code);
      console.log('错误消息:', authError.message);
      
      // 尝试普通 createUser 方法
      console.log('\n尝试使用普通 createUser 方法...');
      const { data: normalData, error: normalError } = await supabaseAdmin.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: { role: testUser.role, username: testUser.username }
        }
      });
      
      if (normalError) {
        console.error('❌ 普通注册也失败:', normalError);
        console.log('错误代码:', normalError.code);
        console.log('错误消息:', normalError.message);
      } else {
        console.log('✅ 普通注册成功:', normalData.user?.id);
      }
    } else {
      console.log('✅ 管理员注册成功:', authData.user.id);
    }
  } catch (error) {
    console.error('❌ 测试异常:', error.message);
  }
}

testRegistration();