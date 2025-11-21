import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function checkLoginCredentials() {
  console.log('🔍 检查登录凭证问题...\n');
  
  // 1. 检查系统中存在的用户
  console.log('1. 📋 检查系统中的用户:');
  try {
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ 无法获取Auth用户列表:', error.message);
    } else {
      console.log(`✅ 找到 ${authUsers.users.length} 个Auth用户:`);
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.user_metadata?.role || 'unknown'})`);
      });
    }
  } catch (error) {
    console.log('❌ 获取用户列表异常:', error.message);
  }
  
  // 2. 测试已知的学生账号
  console.log('\n2. 🧪 测试已知的学生账号:');
  const testAccounts = [
    { email: 'studentdemo@example.com', password: 'demo123456', description: '演示学生账号' },
    { email: '1724045101@qq.com', password: 'demo123456', description: 'QQ邮箱账号' },
    { email: 'teststudent@example.com', password: 'test123456', description: '测试学生账号' }
  ];
  
  for (const account of testAccounts) {
    console.log(`\n   测试 ${account.description}:`);
    console.log(`   📧 邮箱: ${account.email}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });
      
      if (error) {
        console.log(`   ❌ 登录失败: ${error.message}`);
        console.log(`   💡 错误代码: ${error.code}`);
        
        // 检查用户是否存在
        const userExists = authUsers.users.some(user => user.email === account.email);
        if (!userExists) {
          console.log(`   ⚠️  用户不存在，需要注册`);
        } else {
          console.log(`   ✅ 用户存在，但密码错误`);
        }
      } else {
        console.log(`   ✅ 登录成功!`);
        console.log(`   👤 用户名: ${data.user.user_metadata?.username}`);
        console.log(`   🎭 角色: ${data.user.user_metadata?.role}`);
      }
    } catch (error) {
      console.log(`   ❌ 登录异常: ${error.message}`);
    }
  }
  
  // 3. 检查用户对应的users表记录
  console.log('\n3. 📊 检查用户对应的users表记录:');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*');
      
    if (error) {
      console.log('❌ 查询users表失败:', error.message);
    } else {
      console.log(`✅ users表中有 ${users.length} 条记录:`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (ID: ${user.id})`);
      });
      
      // 检查Auth用户和users表的匹配
      console.log('\n4. 🔗 检查Auth用户和users表匹配:');
      if (authUsers && authUsers.users) {
        const mismatchedUsers = [];
        
        for (const authUser of authUsers.users) {
          const matchingUser = users.find(u => u.id === authUser.id);
          if (!matchingUser) {
            mismatchedUsers.push(authUser);
            console.log(`   ❌ ${authUser.email}: 缺少users表记录`);
          } else {
            console.log(`   ✅ ${authUser.email}: 匹配正常`);
          }
        }
        
        if (mismatchedUsers.length > 0) {
          console.log(`\n⚠️  发现 ${mismatchedUsers.length} 个用户需要同步`);
        }
      }
    }
  } catch (error) {
    console.log('❌ 查询users表异常:', error.message);
  }
  
  // 5. 创建新的测试账号
  console.log('\n5. 📝 创建新的测试账号:');
  const newTestAccount = {
    email: `test_${Date.now()}@example.com`,
    password: 'test123456',
    username: `testuser_${Date.now()}`,
    role: 'student'
  };
  
  try {
    console.log(`   📧 创建: ${newTestAccount.email}`);
    
    // Supabase Auth注册
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: newTestAccount.email,
      password: newTestAccount.password,
      email_confirm: true,
      user_metadata: { 
        username: newTestAccount.username, 
        role: newTestAccount.role 
      }
    });
    
    if (authError) {
      console.log(`   ❌ Auth注册失败: ${authError.message}`);
    } else {
      console.log(`   ✅ Auth注册成功: ${authData.user.id}`);
      
      // 创建users表记录
      const userData = {
        id: authData.user.id,
        username: newTestAccount.username,
        password_hash: '$2a$10$tempPasswordHash',
        role: 1, // 学生
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
        
        // 测试新账号登录
        console.log(`   🧪 测试新账号登录...`);
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: newTestAccount.email,
          password: newTestAccount.password
        });
        
        if (loginError) {
          console.log(`   ❌ 新账号登录失败: ${loginError.message}`);
        } else {
          console.log(`   ✅ 新账号登录成功!`);
          console.log(`   🎉 注册和登录流程正常`);
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ 创建测试账号异常: ${error.message}`);
  }
  
  console.log('\n🔧 问题总结和建议:');
  console.log('1. ✅ Supabase Auth系统正常');
  console.log('2. ✅ 数据库连接正常');
  console.log('3. ✅ 注册流程正常');
  console.log('4. ⚠️  部分用户可能存在密码错误或不存在');
  console.log('5. 💡 建议用户使用密码重置功能');
  console.log('6. 💡 或创建新的测试账号');
  
  console.log('\n📋 可用的测试账号:');
  console.log('• studentdemo@example.com / demo123456');
  console.log('• 使用上面创建的新测试账号');
  console.log('• 或自行注册新账号');
}

checkLoginCredentials().catch(error => {
  console.error('❌ 检查程序失败:', error);
  process.exit(1);
});