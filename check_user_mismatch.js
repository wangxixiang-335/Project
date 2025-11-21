import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function checkUserMismatch() {
  console.log('🔍 检查用户数据不匹配问题...\n');
  
  // 测试登录的学生账号
  const testEmail = 'studentdemo@example.com';
  const testPassword = 'demo123456';
  
  console.log('1. 测试登录并获取用户信息:');
  let authUserId;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.log(`❌ 登录失败: ${error.message}`);
      return;
    }
    
    authUserId = data.user.id;
    console.log('✅ 登录成功!');
    console.log(`Auth用户ID: ${authUserId}`);
    console.log(`邮箱: ${data.user.email}`);
    console.log(`用户名: ${data.user.user_metadata?.username}`);
    console.log(`角色: ${data.user.user_metadata?.role}`);
    
  } catch (error) {
    console.log('❌ 登录测试异常:', error.message);
    return;
  }
  
  // 检查users表中是否有对应记录
  console.log('\n2. 检查users表中对应记录:');
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId);
      
    if (error) {
      console.log('❌ 查询users表失败:', error.message);
    } else if (userData && userData.length > 0) {
      console.log('✅ 找到对应users记录:', userData[0]);
    } else {
      console.log('❌ 未找到对应users记录');
      console.log('这会导致登录后无法获取用户详细信息');
    }
  } catch (error) {
    console.log('❌ 查询users表异常:', error.message);
  }
  
  // 检查所有学生用户的匹配情况
  console.log('\n3. 检查所有学生用户的Auth和users表匹配:');
  try {
    // 获取所有学生Auth用户
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ 获取Auth用户失败:', authError.message);
    } else {
      const studentAuthUsers = authUsers.users.filter(user => 
        user.user_metadata?.role === 'student'
      );
      
      console.log(`找到 ${studentAuthUsers.length} 个学生Auth用户`);
      
      // 检查每个Auth用户是否有对应的users记录
      for (const authUser of studentAuthUsers) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, username, role, created_at')
          .eq('id', authUser.id);
          
        if (error) {
          console.log(`❌ ${authUser.email}: 查询失败 - ${error.message}`);
        } else if (userData && userData.length > 0) {
          console.log(`✅ ${authUser.email}: users表记录正常`);
        } else {
          console.log(`⚠️  ${authUser.email}: 缺少users表记录 (AuthID: ${authUser.id})`);
        }
      }
    }
  } catch (error) {
    console.log('❌ 检查用户匹配异常:', error.message);
  }
  
  // 检查反向匹配 - users表中记录是否都有Auth用户
  console.log('\n4. 检查users表记录是否有对应Auth用户:');
  try {
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('id, username, role, created_at');
      
    if (error) {
      console.log('❌ 查询users表失败:', error.message);
    } else {
      console.log(`users表中有 ${allUsers.length} 条记录`);
      
      for (const user of allUsers) {
        try {
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(user.id);
          
          if (authError) {
            console.log(`❌ ${user.username}: 找不到对应Auth用户 - ${authError.message}`);
          } else {
            console.log(`✅ ${user.username}: Auth用户存在`);
          }
        } catch (error) {
          console.log(`❌ ${user.username}: 检查Auth用户异常 - ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.log('❌ 检查反向匹配异常:', error.message);
  }
  
  // 提供修复建议
  console.log('\n🔧 修复建议:');
  console.log('问题: Auth用户和users表记录不匹配');
  console.log('解决方案:');
  console.log('1. 为现有的Auth学生用户创建对应的users表记录');
  console.log('2. 确保新用户注册时同时创建Auth和users记录');
  console.log('3. 检查users表的ID字段是否正确设置为UUID类型');
  
  // 生成修复脚本
  console.log('\n📝 自动生成修复脚本...');
  
  // 获取需要修复的Auth用户
  try {
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!error) {
      const studentAuthUsers = authUsers.users.filter(user => 
        user.user_metadata?.role === 'student'
      );
      
      console.log('\n-- 修复脚本: 为Auth学生用户创建users表记录');
      console.log('BEGIN;');
      
      for (const authUser of studentAuthUsers) {
        // 检查是否已有对应记录
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .single();
          
        if (!existingUser) {
          console.log(`-- 为 ${authUser.email} 创建users记录`);
          console.log(`INSERT INTO users (id, username, password_hash, role, created_at) VALUES (`);
          console.log(`  '${authUser.id}',`);
          console.log(`  '${authUser.user_metadata?.username || authUser.email}',`);
          console.log(`  '$2a$10$tempPasswordHash',`);
          console.log(`  1,`);
          console.log(`  '${new Date().toISOString()}'`);
          console.log(`);`);
          console.log('');
        }
      }
      
      console.log('COMMIT;');
    }
  } catch (error) {
    console.log('❌ 生成修复脚本失败:', error.message);
  }
}

checkUserMismatch().catch(error => {
  console.error('❌ 检查程序失败:', error);
  process.exit(1);
});