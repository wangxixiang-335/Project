import { supabase } from './src/config/supabase.js';

async function checkTeachers() {
  try {
    console.log('🔍 查询教师账户...');
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role')
      .eq('role', 'teacher');
    
    if (error) {
      console.error('❌ 查询错误:', error);
    } else {
      console.log('✅ 找到的教师账户:', data);
      
      if (data.length === 0) {
        console.log('⚠️  没有找到教师账户，检查所有用户...');
        const { data: allUsers, error: allError } = await supabase
          .from('users')
          .select('id, username, email, role')
          .limit(10);
        
        if (allError) {
          console.error('❌ 查询所有用户错误:', allError);
        } else {
          console.log('👥 所有用户:', allUsers);
        }
      }
    }
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

checkTeachers();