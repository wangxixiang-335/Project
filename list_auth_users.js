import { supabase } from './src/config/supabase.js';

async function listAuthUsers() {
  try {
    console.log('🔍 获取认证用户列表...');
    
    // 尝试获取用户列表（需要管理员权限，可能无法工作）
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.log('⚠️ 无法获取管理员用户列表:', error.message);
      } else {
        console.log('✅ 认证用户列表:', data.users);
      }
    } catch (adminError) {
      console.log('⚠️ 管理员API不可用:', adminError.message);
    }
    
    // 尝试使用已有用户登录
    console.log('\n🔑 尝试使用现有教师账号登录...');
    
    // 尝试不同的用户名组合作为邮箱
    const testEmails = [
      'teacher@example.com',
      'teacher1@example.com', 
      'admin@example.com'
    ];
    
    for (const email of testEmails) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: '123456'
        });
        
        if (error) {
          console.log(`❌ ${email} 登录失败:`, error.message);
        } else {
          console.log(`✅ ${email} 登录成功!`);
          console.log('📋 用户信息:', data.user);
          console.log('📋 Session:', data.session);
          return data;
        }
      } catch (loginError) {
        console.log(`❌ ${email} 登录异常:`, loginError.message);
      }
    }
    
  } catch (error) {
    console.error('🔥 获取用户列表时发生错误:', error);
  }
}

listAuthUsers();