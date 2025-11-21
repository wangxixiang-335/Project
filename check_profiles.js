import { supabaseAdmin } from './src/config/supabase.js';

async function checkProfilesTable() {
  try {
    console.log('检查profiles表结构...');
    
    // 检查表是否存在
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ 查询profiles表错误:', tableError.message);
      console.log('错误代码:', tableError.code);
      
      if (tableError.code === 'PGRST204') {
        console.log('💡 profiles表不存在，需要创建');
      }
    } else {
      console.log('✅ profiles表存在');
      console.log('表数据样本:', tableInfo);
    }
    
    // 检查最近注册的用户
    console.log('\n检查最近注册的用户...');
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ 查询用户列表错误:', usersError.message);
    } else {
      console.log('最近注册用户:', users.users.slice(-3).map(u => ({
        id: u.id,
        email: u.email,
        username: u.user_metadata?.username,
        role: u.user_metadata?.role
      })));
    }
    
  } catch (error) {
    console.log('异常错误:', error.message);
  }
}

checkProfilesTable();