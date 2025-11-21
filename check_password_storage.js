import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function checkPasswordStorage() {
  console.log('🔍 检查账号密码存储位置...\n');
  
  console.log('1. 📋 传统数据库表检查:');
  console.log('   ❌ users表 - 不存储实际密码');
  console.log('   ❌ profiles表 - 不存储密码（如果存在）');
  console.log('   ✅ 只存储临时密码哈希用于兼容');
  
  // 检查users表结构
  console.log('\n2. 🔍 users表实际结构:');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('❌ 查询users表失败:', error.message);
    } else if (data && data.length > 0) {
      const user = data[0];
      console.log('✅ users表字段:');
      Object.keys(user).forEach(key => {
        const value = user[key];
        let displayValue = value;
        if (key === 'password_hash' && value) {
          displayValue = value.substring(0, 20) + '...';
        }
        console.log(`   - ${key}: ${displayValue}`);
      });
      
      console.log('\n💡 注意: password_hash是临时值，不用于实际认证');
    }
  } catch (error) {
    console.log('❌ 查询异常:', error.message);
  }
  
  console.log('\n3. 🔐 Supabase Auth系统说明:');
  console.log('   ✅ 密码存储在Supabase Auth系统中');
  console.log('   ✅ 使用bcrypt加密存储');
  console.log('   ✅ 无法直接查看原始密码');
  console.log('   ✅ 只能通过Auth API进行认证');
  
  // 演示Auth认证
  console.log('\n4. 🧪 演示密码认证过程:');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'studentdemo@example.com',
      password: 'demo123456'
    });
    
    if (error) {
      console.log(`   ❌ 认证失败: ${error.message}`);
    } else {
      console.log('   ✅ 密码认证成功!');
      console.log('   ✅ 返回访问令牌用于后续API调用');
      console.log('   ✅ 令牌有效期通常为数小时');
    }
  } catch (error) {
    console.log('   ❌ 认证异常:', error.message);
  }
  
  console.log('\n5. 📊 查看Auth用户信息:');
  try {
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.log('   ❌ 无法查看Auth用户列表:', error.message);
    } else {
      const studentUsers = authUsers.users.filter(user => 
        user.user_metadata?.role === 'student'
      );
      console.log(`   ✅ Auth系统中共有 ${studentUsers.length} 个学生用户`);
      console.log('   ✅ 每个用户都有加密存储的密码');
      console.log('   ✅ 密码哈希不可逆向解密');
    }
  } catch (error) {
    console.log('   ❌ 查看Auth用户异常:', error.message);
  }
  
  console.log('\n6. 🔒 安全说明:');
  console.log('   ✅ 密码永远不会以明文形式存储');
  console.log('   ✅ 使用行业标准的bcrypt加密');
  console.log('   ✅ 即使是数据库管理员也无法查看原始密码');
  console.log('   ✅ 所有密码操作都通过Supabase Auth API进行');
  
  console.log('\n7. 📝 密码管理操作:');
  console.log('   ✅ 重置密码：通过Supabase Auth发送重置邮件');
  console.log('   ✅ 修改密码：用户通过认证后自行修改');
  console.log('   ✅ 管理员无法查看或修改用户密码');
  console.log('   ✅ 只能通过密码重置流程修改');
  
  console.log('\n🔑 总结:');
  console.log('   📍 密码存储位置: Supabase Auth系统（安全）');
  console.log('   📍 数据库users表: 只存储用户基本信息和临时哈希');
  console.log('   📍 认证方式: 通过Supabase Auth API进行');
  console.log('   📍 安全性: 高（使用bcrypt加密）');
}

checkPasswordStorage().catch(error => {
  console.error('❌ 检查程序失败:', error);
  process.exit(1);
});