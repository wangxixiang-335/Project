import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function fixUserSync() {
  console.log('🔧 开始修复用户数据同步问题...');
  
  // 获取所有需要修复的学生Auth用户
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authError) {
    console.log('❌ 获取Auth用户失败:', authError.message);
    return;
  }
  
  const studentAuthUsers = authUsers.users.filter(user => 
    user.user_metadata?.role === 'student'
  );
  
  console.log(`找到 ${studentAuthUsers.length} 个学生Auth用户需要同步`);
  
  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // 逐个检查和修复
  for (const authUser of studentAuthUsers) {
    try {
      // 检查是否已有对应记录
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();
        
      if (existingUser) {
        console.log(`✅ ${authUser.email}: 已存在users记录，跳过`);
        skippedCount++;
        continue;
      }
      
      // 创建users记录
      const userData = {
        id: authUser.id,
        username: authUser.user_metadata?.username || authUser.email.split('@')[0],
        password_hash: '$2a$10$tempPasswordHash', // 临时密码哈希
        role: 1, // 学生角色
        created_at: authUser.created_at || new Date().toISOString()
      };
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
        
      if (insertError) {
        console.log(`❌ ${authUser.email}: 创建users记录失败 - ${insertError.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${authUser.email}: 成功创建users记录`);
        fixedCount++;
      }
      
    } catch (error) {
      console.log(`❌ ${authUser.email}: 处理异常 - ${error.message}`);
      errorCount++;
    }
    
    // 小延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('
📊 修复完成!');
  console.log(`✅ 成功修复: ${fixedCount} 个`);
  console.log(`⏭️  跳过: ${skippedCount} 个`);
  console.log(`❌ 失败: ${errorCount} 个`);
  
  // 验证修复结果
  console.log('
🔍 验证修复结果:');
  
  // 测试登录演示学生账号
  console.log('测试演示学生账号登录...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'studentdemo@example.com',
      password: 'demo123456'
    });
    
    if (error) {
      console.log(`❌ 登录失败: ${error.message}`);
    } else {
      console.log('✅ 登录成功!');
      
      // 检查对应的users记录
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (userError) {
        console.log('❌ 仍然找不到users记录:', userError.message);
      } else {
        console.log('✅ 成功找到users记录:', userData);
        console.log('🎉 登录问题已修复!');
      }
    }
  } catch (error) {
    console.log('❌ 登录测试异常:', error.message);
  }
}

fixUserSync().catch(error => {
  console.error('❌ 修复程序失败:', error);
  process.exit(1);
});