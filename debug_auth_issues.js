import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function debugAuthIssues() {
  console.log('🔍 开始诊断注册和登录问题...\n');
  
  // 1. 检查后端服务器状态
  console.log('1. 🌐 检查后端API状态:');
  try {
    const response = await fetch('http://localhost:8090/api/health', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('✅ 后端API正常运行');
    } else {
      console.log(`❌ 后端API异常: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ 无法连接后端API:', error.message);
    console.log('💡 请确保后端服务器已启动: npm start');
  }
  
  // 2. 检查Supabase连接
  console.log('\n2. 🔗 检查Supabase连接:');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (error) {
      console.log('❌ Supabase连接失败:', error.message);
    } else {
      console.log('✅ Supabase连接正常');
    }
  } catch (error) {
    console.log('❌ Supabase连接异常:', error.message);
  }
  
  // 3. 检查关键表结构
  console.log('\n3. 📊 检查数据库表结构:');
  const criticalTables = ['users', 'classes', 'grades'];
  
  for (const tableName of criticalTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ ${tableName}表不存在`);
        } else {
          console.log(`❌ ${tableName}表查询失败: ${error.message}`);
        }
      } else {
        console.log(`✅ ${tableName}表存在 (${data.length} 条记录)`);
      }
    } catch (error) {
      console.log(`❌ ${tableName}表检查异常: ${error.message}`);
    }
  }
  
  // 4. 检查Supabase Auth配置
  console.log('\n4. 🔐 检查Supabase Auth配置:');
  try {
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    
    if (error) {
      console.log('❌ Supabase Auth配置错误:', error.message);
    } else {
      console.log('✅ Supabase Auth配置正常');
      console.log(`   📊 当前有 ${authUsers.users.length} 个用户`);
    }
  } catch (error) {
    console.log('❌ Supabase Auth检查失败:', error.message);
  }
  
  // 5. 测试注册流程
  console.log('\n5. 📝 测试注册流程:');
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'test123456',
    username: `testuser_${Date.now()}`,
    role: 'student'
  };
  
  try {
    // 测试Supabase Auth注册
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: { 
        username: testUser.username, 
        role: testUser.role 
      }
    });
    
    if (authError) {
      console.log(`❌ Supabase Auth注册失败: ${authError.message}`);
    } else {
      console.log('✅ Supabase Auth注册成功');
      console.log(`   📧 用户ID: ${authData.user.id}`);
      
      // 测试创建users表记录
      try {
        const userData = {
          id: authData.user.id,
          username: testUser.username,
          password_hash: '$2a$10$tempPasswordHash',
          role: 1,
          created_at: new Date().toISOString()
        };
        
        const { data: userResult, error: userError } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();
          
        if (userError) {
          console.log(`❌ users表记录创建失败: ${userError.message}`);
          console.log(`   💡 错误代码: ${userError.code}`);
        } else {
          console.log('✅ users表记录创建成功');
        }
      } catch (error) {
        console.log(`❌ users表操作异常: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ 注册流程异常: ${error.message}`);
  }
  
  // 6. 测试登录流程
  console.log('\n6. 🔑 测试登录流程:');
  try {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'studentdemo@example.com',
      password: 'demo123456'
    });
    
    if (loginError) {
      console.log(`❌ 登录失败: ${loginError.message}`);
      console.log(`   💡 错误代码: ${loginError.code}`);
    } else {
      console.log('✅ 登录成功');
      console.log(`   📧 用户: ${loginData.user.email}`);
      console.log(`   🔑 令牌: ${loginData.session.access_token.substring(0, 20)}...`);
    }
  } catch (error) {
    console.log(`❌ 登录流程异常: ${error.message}`);
  }
  
  // 7. 检查常见错误
  console.log('\n7. 🔍 常见错误检查:');
  
  // 检查邮箱唯一性约束
  try {
    const { data: duplicateCheck, error: dupError } = await supabase
      .from('users')
      .select('email')
      .eq('email', 'studentdemo@example.com');
      
    if (!dupError && duplicateCheck && duplicateCheck.length > 1) {
      console.log('⚠️  发现重复邮箱地址');
    }
  } catch (error) {
    // 忽略错误
  }
  
  // 检查用户名唯一性
  try {
    const { data: usernameCheck, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('username', 'student1');
      
    if (!userError && usernameCheck && usernameCheck.length > 1) {
      console.log('⚠️  发现重复用户名');
    }
  } catch (error) {
    // 忽略错误
  }
  
  console.log('\n🔧 修复建议汇总:');
  console.log('1. 确保后端服务器正常运行');
  console.log('2. 检查Supabase配置是否正确');
  console.log('3. 验证数据库表结构完整性');
  console.log('4. 检查网络连接和端口配置');
  console.log('5. 查看具体的错误日志信息');
  
  console.log('\n📋 下一步操作:');
  console.log('• 启动后端服务器: npm start');
  console.log('• 检查前端控制台错误');
  console.log('• 提供具体的错误信息给我');
}

debugAuthIssues().catch(error => {
  console.error('❌ 诊断程序失败:', error);
  process.exit(1);
});