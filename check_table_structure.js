import { supabase } from './src/config/supabase.js';

async function checkTableStructure() {
  try {
    console.log('🔍 查询用户表结构...');
    
    // Try to get a single user to see the structure
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (users && users.length > 0) {
      console.log('✅ 用户表字段:', Object.keys(users[0]));
      console.log('👤 示例用户:', users[0]);
    } else if (userError) {
      console.error('❌ 查询错误:', userError);
    } else {
      console.log('⚠️  用户表为空');
    }
    
    // Check all users
    console.log('🔍 查询所有用户...');
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('id, username, role')
      .limit(10);
    
    if (allError) {
      console.error('❌ 查询所有用户错误:', allError);
    } else {
      console.log('👥 所有用户:', allUsers);
    }
    
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

checkTableStructure();