import { supabase } from './src/config/supabase.js';

async function checkTeacherAccounts() {
  try {
    console.log('🔍 检查教师账号...');
    
    // 查询所有教师角色用户
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 2); // role=2 表示教师
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log(`✅ 找到 ${users.length} 个教师账号:`);
    users.forEach((user, index) => {
      console.log(`\n📋 教师 ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   角色: ${user.role} (2=教师)`);
      console.log(`   班级ID: ${user.class_id}`);
      console.log(`   创建时间: ${user.created_at}`);
    });
    
    // 如果没有教师账号，创建一个测试账号
    if (users.length === 0) {
      console.log('\n🔧 没有找到教师账号，创建测试教师账号...');
      
      const { data: newUser, error: createError } = await supabase.auth.signUp({
        email: 'testteacher123@example.com',
        password: '123456',
        options: {
          data: {
            role: 'teacher',
            full_name: '测试教师'
          }
        }
      });
      
      if (createError) {
        console.error('❌ 创建教师账号失败:', createError);
      } else {
        console.log('✅ 教师账号创建成功:', newUser);
        
        // 在users表中添加用户记录
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: newUser.user.id,
            username: 'testteacher123',
            email: 'testteacher123@example.com',
            role: 2,
            class_id: null
          });
        
        if (insertError) {
          console.error('❌ 插入用户记录失败:', insertError);
        } else {
          console.log('✅ 用户记录插入成功');
        }
      }
    }
    
  } catch (error) {
    console.error('🔥 检查过程中发生错误:', error);
  }
}

checkTeacherAccounts();