import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function resetTestPasswords() {
  console.log('🔧 重置测试账号密码...\n');
  
  // 需要重置密码的账号
  const accountsToReset = [
    { email: '1724045101@qq.com', newPassword: '12345678', description: 'QQ邮箱账号' },
    { email: '3888952060@qq.com', newPassword: '12345678', description: '教师QQ账号' }
  ];
  
  console.log('1. 📋 当前系统中的用户:');
  try {
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ 无法获取用户列表:', error.message);
      return;
    }
    
    console.log(`✅ 找到 ${authUsers.users.length} 个用户:`);
    authUsers.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.user_metadata?.role || 'unknown'})`);
    });
    
    // 2. 重置指定账号密码
    console.log('\n2. 🔐 重置指定账号密码:');
    
    for (const account of accountsToReset) {
      console.log(`\n   重置 ${account.description}:`);
      console.log(`   📧 邮箱: ${account.email}`);
      console.log(`   🔑 新密码: ${account.newPassword}`);
      
      try {
        // 查找用户
        const targetUser = authUsers.users.find(user => user.email === account.email);
        
        if (!targetUser) {
          console.log(`   ❌ 用户不存在`);
          continue;
        }
        
        // 更新密码
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
          targetUser.id,
          { 
            password: account.newPassword,
            email_confirm: true // 确保邮箱已验证
          }
        );
        
        if (error) {
          console.log(`   ❌ 密码重置失败: ${error.message}`);
        } else {
          console.log(`   ✅ 密码重置成功!`);
          
          // 测试新密码登录
          console.log(`   🧪 测试新密码登录...`);
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: account.newPassword
          });
          
          if (loginError) {
            console.log(`   ❌ 登录测试失败: ${loginError.message}`);
          } else {
            console.log(`   ✅ 登录测试成功!`);
            console.log(`   👤 用户: ${loginData.user.user_metadata?.username}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ 密码重置异常: ${error.message}`);
      }
      
      // 小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 3. 创建标准测试账号
    console.log('\n3. 📝 创建标准测试账号:');
    const standardTestAccounts = [
      { email: 'student@example.com', password: 'student123', username: '测试学生', role: 'student' },
      { email: 'teacher@example.com', password: 'teacher123', username: '测试教师', role: 'teacher' }
    ];
    
    for (const account of standardTestAccounts) {
      console.log(`\n   创建 ${account.role} 账号:`);
      console.log(`   📧 邮箱: ${account.email}`);
      console.log(`   🔑 密码: ${account.password}`);
      
      try {
        // 检查是否已存在
        const existingUser = authUsers.users.find(user => user.email === account.email);
        
        if (existingUser) {
          console.log(`   ⏭️  账号已存在，跳过创建`);
          
          // 更新密码
          const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { password: account.password }
          );
          
          if (error) {
            console.log(`   ❌ 密码更新失败: ${error.message}`);
          } else {
            console.log(`   ✅ 密码更新成功!`);
          }
          continue;
        }
        
        // 创建新用户
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: { 
            username: account.username, 
            role: account.role 
          }
        });
        
        if (authError) {
          console.log(`   ❌ Auth创建失败: ${authError.message}`);
          continue;
        }
        
        console.log(`   ✅ Auth创建成功: ${authData.user.id}`);
        
        // 创建users表记录
        const userData = {
          id: authData.user.id,
          username: account.username,
          password_hash: '$2a$10$tempPasswordHash',
          role: account.role === 'student' ? 1 : 2,
          created_at: new Date().toISOString()
        };
        
        const { data: userResult, error: userError } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();
          
        if (userError) {
          console.log(`   ❌ users记录创建失败: ${userError.message}`);
        } else {
          console.log(`   ✅ users记录创建成功`);
          
          // 测试登录
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: account.password
          });
          
          if (loginError) {
            console.log(`   ❌ 登录测试失败: ${loginError.message}`);
          } else {
            console.log(`   ✅ 登录测试成功!`);
          }
        }
      } catch (error) {
        console.log(`   ❌ 创建过程异常: ${error.message}`);
      }
      
      // 小延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 密码重置完成!');
    console.log('\n📋 更新后的测试账号:');
    console.log('• 1724045101@qq.com / 12345678');
    console.log('• 3888952060@qq.com / 12345678');
    console.log('• student@example.com / student123');
    console.log('• teacher@example.com / teacher123');
    
  } catch (error) {
    console.log('❌ 程序异常:', error.message);
  }
}

resetTestPasswords().catch(error => {
  console.error('❌ 重置程序失败:', error);
  process.exit(1);
});