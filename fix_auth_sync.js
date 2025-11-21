import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function syncUsersToAuth() {
  try {
    console.log('🔄 开始同步用户到Supabase Auth...');
    
    // Get all users from the users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ 获取用户列表失败:', usersError);
      return;
    }
    
    console.log(`📋 找到 ${users.length} 个用户需要同步`);
    
    for (const user of users) {
      try {
        console.log(`🔄 同步用户: ${user.username} (${user.id})`);
        
        // Check if user already exists in Auth
        const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.getUserById(user.id);
        
        if (existingUser.user) {
          console.log(`✅ 用户 ${user.username} 已存在，跳过`);
          continue;
        }
        
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          id: user.id,
          email: `${user.username}@example.com`,
          password: 'password123', // Default password
          email_confirm: true,
          user_metadata: {
            username: user.username,
            role: user.role === 1 ? 'student' : user.role === 2 ? 'teacher' : 'admin'
          }
        });
        
        if (authError) {
          console.error(`❌ 创建用户 ${user.username} 失败:`, authError.message);
        } else {
          console.log(`✅ 用户 ${user.username} 同步成功`);
        }
        
      } catch (err) {
        console.error(`❌ 同步用户 ${user.username} 时出错:`, err.message);
      }
    }
    
    console.log('🎉 用户同步完成！');
    
  } catch (err) {
    console.error('❌ 同步过程出错:', err.message);
  }
}

// Run the sync
syncUsersToAuth();