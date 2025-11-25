import { supabase } from './src/config/supabase.js';

async function checkUsers() {
  try {
    console.log('检查现有用户...');
    
    // 检查auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('获取认证用户失败:', authError);
      return;
    }
    
    console.log('认证用户列表:');
    authUsers.users.forEach(user => {
      console.log(`- ${user.email} (${user.user_metadata?.role || 'unknown'}) - ${user.id}`);
    });
    
    // 检查users表
    try {
      const { data: dbUsers, error: dbError } = await supabase
        .from('users')
        .select('id, username, email, role, created_at');
        
      if (dbError) {
        console.log('users表不存在或查询失败:', dbError.message);
      } else {
        console.log('\n数据库用户列表:');
        dbUsers.forEach(user => {
          const roleText = user.role === 1 ? 'student' : user.role === 2 ? 'teacher' : 'admin';
          console.log(`- ${user.username} (${roleText}) - ${user.email || 'no email'} - ${user.id}`);
        });
      }
    } catch (error) {
      console.log('查询users表异常:', error.message);
    }
    
  } catch (error) {
    console.error('检查用户失败:', error.message);
  }
}

checkUsers();