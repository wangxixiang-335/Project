import { supabase } from './src/config/supabase.js';

async function findStudentUser() {
  try {
    console.log('🔍 查找学生用户...\n');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, role, created_at')
      .eq('role', 1) // 学生角色
      .limit(5);

    if (error) {
      console.error('查询错误:', error);
      return;
    }

    if (users && users.length > 0) {
      console.log(`找到 ${users.length} 个学生用户:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   用户名: ${user.username}`);
        console.log(`   角色: ${user.role} (1=学生)`);
        console.log(`   创建时间: ${user.created_at}`);
      });
    } else {
      console.log('未找到学生用户');
    }

  } catch (error) {
    console.error('查找失败:', error);
  }
}

// 运行查找
findStudentUser();