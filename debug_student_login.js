import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function debugStudentLogin() {
  console.log('🔍 开始调试学生账号登录问题...\n');
  
  // 检查学生账号数据
  console.log('1. 检查数据库中的用户数据:');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 1) // 学生角色
      .limit(5);
      
    if (error) {
      console.log('❌ 查询users表失败:', error.message);
    } else {
      console.log(`✅ 找到 ${users.length} 个学生账号:`);
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 创建时间: ${user.created_at}`);
      });
    }
  } catch (error) {
    console.log('❌ 查询异常:', error.message);
  }
  
  // 检查Supabase Auth中的用户
  console.log('\n2. 检查Supabase Auth用户:');
  try {
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ 查询Auth用户失败:', error.message);
    } else {
      const studentUsers = authUsers.users.filter(user => 
        user.user_metadata?.role === 'student'
      );
      console.log(`✅ 找到 ${studentUsers.length} 个学生Auth账号:`);
      studentUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, 邮箱: ${user.email}, 用户名: ${user.user_metadata?.username}`);
      });
    }
  } catch (error) {
    console.log('❌ 查询Auth用户异常:', error.message);
  }
  
  // 尝试使用预设的学生账号登录
  console.log('\n3. 测试学生账号登录:');
  const testEmail = 'studentdemo@example.com';
  const testPassword = 'demo123456';
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.log(`❌ 登录失败: ${error.message}`);
      console.log(`错误代码: ${error.code}`);
      console.log(`错误状态: ${error.status}`);
    } else {
      console.log('✅ 登录成功!');
      console.log(`用户ID: ${data.user.id}`);
      console.log(`邮箱: ${data.user.email}`);
      console.log(`用户名: ${data.user.user_metadata?.username}`);
      console.log(`角色: ${data.user.user_metadata?.role}`);
      
      // 检查对应的users表记录
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (userError) {
        console.log('❌ 未找到对应的users表记录:', userError.message);
      } else {
        console.log('✅ 找到users表记录:', userData);
      }
    }
  } catch (error) {
    console.log('❌ 登录测试异常:', error.message);
  }
  
  // 检查表结构
  console.log('\n4. 检查关键表结构:');
  
  // 检查users表结构
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users'
          ORDER BY ordinal_position;
        `
      });
      
    if (error) {
      console.log('❌ 无法获取users表结构:', error.message);
    } else {
      console.log('✅ users表结构:');
      data.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
  } catch (error) {
    console.log('❌ 查询users表结构异常:', error.message);
  }
  
  // 检查是否有其他用户表
  console.log('\n5. 检查其他可能的用户表:');
  const possibleUserTables = ['profiles', 'students', 'accounts'];
  
  for (const tableName of possibleUserTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (!error) {
        console.log(`✅ ${tableName}表存在，有 ${data.length} 条记录`);
      }
    } catch (error) {
      // 表不存在，忽略
    }
  }
  
  console.log('\n🔍 调试完成！');
  console.log('\n常见问题排查建议:');
  console.log('1. 检查邮箱和密码是否正确');
  console.log('2. 确认用户存在于Supabase Auth中');
  console.log('3. 检查users表是否存在且结构正确');
  console.log('4. 验证用户角色设置是否正确');
  console.log('5. 检查网络连接和API端点配置');
}

debugStudentLogin().catch(error => {
  console.error('❌ 调试程序失败:', error);
  process.exit(1);
});