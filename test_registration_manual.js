import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testRegistration() {
  console.log('🧪 测试注册功能...\n');

  try {
    // 创建Supabase管理客户端
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 测试数据
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      username: `testuser${Date.now()}`,
      role: 'student'
    };

    console.log('📝 测试用户数据:');
    console.log('  - 邮箱:', testUser.email);
    console.log('  - 用户名:', testUser.username);
    console.log('  - 角色:', testUser.role);

    // 1. 创建Auth用户
    console.log('\n1. 创建Supabase Auth用户...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: { 
        role: testUser.role, 
        username: testUser.username 
      }
    });

    if (authError) {
      console.error('❌ 创建Auth用户失败:', authError);
      return;
    }

    console.log('✅ Auth用户创建成功:', authData.user.id);

    // 2. 尝试创建profile记录
    console.log('\n2. 创建profile记录...');
    const profileData = {
      id: authData.user.id,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role,
      created_at: new Date().toISOString()
    };

    const { data: profileResult, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST204') {
        console.log('❌ profiles表不存在，无法创建profile记录');
        console.log('💡 提示：profiles表需要手动创建');
      } else if (profileError.message.includes('violates foreign key constraint')) {
        console.log('❌ 外键约束错误：auth.users表可能不存在');
        console.log('💡 提示：新数据库需要启用Supabase Auth服务');
      } else {
        console.error('❌ 创建profile记录失败:', profileError);
      }
    } else {
      console.log('✅ Profile记录创建成功');
    }

    // 3. 测试登录
    console.log('\n3. 测试登录功能...');
    const supabaseNormal = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: sessionData, error: sessionError } = await supabaseNormal.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });

    if (sessionError) {
      console.error('❌ 登录失败:', sessionError);
    } else {
      console.log('✅ 登录成功');
      console.log('   - 用户ID:', sessionData.user.id);
      console.log('   - 邮箱:', sessionData.user.email);
      console.log('   - Token有效');
    }

    // 4. 获取用户信息
    console.log('\n4. 获取用户信息...');
    const { data: userInfo, error: userError } = await supabaseNormal.auth.getUser();
    
    if (userError) {
      console.log('❌ 获取用户信息失败:', userError);
    } else {
      console.log('✅ 用户信息获取成功');
      console.log('   - 用户名:', userInfo.user.user_metadata?.username || '未知');
      console.log('   - 角色:', userInfo.user.user_metadata?.role || '未知');
    }

    console.log('\n🎉 注册功能测试完成！');
    
    // 提供下一步建议
    console.log('\n📋 下一步建议:');
    if (profileError) {
      console.log('   1. 通过Supabase Dashboard手动创建profiles表');
      console.log('   2. 或者运行数据库初始化SQL');
    } else {
      console.log('   1. 注册功能完全正常！');
    }

  } catch (error) {
    console.error('❌ 测试过程异常:', error);
  }
}

testRegistration();