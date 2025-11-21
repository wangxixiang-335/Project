import { supabaseAdmin } from './src/config/supabase.js';

async function checkUsersAndCreateTestAccount() {
  try {
    console.log('🔍 检查所有用户信息...');
    
    // 使用admin权限查询所有用户
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log('找到的用户:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   角色: ${user.role}`);
      console.log(`   创建时间: ${user.created_at}`);
      console.log('---');
    });
    
    // 创建一个新的测试学生账号
    console.log('\n📝 创建新测试学生账号...');
    const testEmail = 'studentdemo@example.com';
    const testPassword = 'demo123456';
    const testUsername = '演示学生';
    
    // 使用admin客户端创建用户
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        username: testUsername,
        role: 'student'
      }
    });
    
    if (authError) {
      console.error('❌ 创建用户失败:', authError);
      return;
    }
    
    console.log('✅ 创建用户成功:', authUser.user.email);
    console.log('用户ID:', authUser.user.id);
    
    // 在profiles表中创建对应的记录
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        username: testUsername,
        email: testEmail,
        role: 'student',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ 创建profile失败:', profileError);
    } else {
      console.log('✅ 创建profile成功:', profile.username);
    }
    
    console.log('\n🎯 测试账号信息:');
    console.log('邮箱:', testEmail);
    console.log('密码:', testPassword);
    console.log('角色: student');
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkUsersAndCreateTestAccount();