import { supabaseAdmin } from './src/config/supabase.js'

console.log('开始初始化新数据库...')

async function initDatabase() {
  try {
    console.log('1. 测试数据库连接...')
    
    // 先测试连接
    const { data: testData, error: testError } = await supabaseAdmin.from('_test').select('*').limit(1)
    
    if (testError && testError.code === '42P01') {
      console.log('✅ 数据库连接正常，表不存在是预期的')
    } else if (testError) {
      console.log('✅ 数据库连接正常，错误代码:', testError.code)
    } else {
      console.log('✅ 数据库连接正常')
    }

    console.log('\n2. 直接测试创建用户...')
    await testRegistration()

  } catch (error) {
    console.error('❌ 初始化过程中发生异常:', error)
  }
}

async function testRegistration() {
  try {
    const testEmail = `test_${Date.now()}@test.com`
    const testPassword = 'test123456'
    const testUsername = 'testuser'
    const testRole = 'student'

    console.log('测试注册数据:', { testEmail })

    console.log('\n2.1 创建Auth用户...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { role: testRole, username: testUsername }
    })

    if (authError) {
      console.error('❌ 创建用户失败:', authError)
      console.error('错误代码:', authError.code)
      console.error('错误详情:', authError.message)
      
      // 如果是表不存在的问题，提示用户手动创建表
      if (authError.message.includes('profile') || authError.message.includes('table')) {
        console.log('\n🔧 需要手动创建数据库表结构')
        console.log('请按照以下步骤操作：')
        console.log('1. 登录到 Supabase 控制台: https://supabase.com/dashboard')
        console.log('2. 进入你的项目 "Project"')
        console.log('3. 点击左侧菜单 "SQL Editor"')
        console.log('4. 运行以下 SQL 语句:')
        console.log(`
          -- 创建profiles表
          CREATE TABLE profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- 创建索引
          CREATE UNIQUE INDEX profiles_username_idx ON profiles(username);
          CREATE UNIQUE INDEX profiles_email_idx ON profiles(email);

          -- 启用行级安全
          ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

          -- 创建RLS策略
          CREATE POLICY "用户可以查看自己的profile" ON profiles
            FOR SELECT USING (auth.uid() = id);

          CREATE POLICY "用户可以更新自己的profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);

          CREATE POLICY "教师可以查看所有用户profile" ON profiles
            FOR SELECT USING (
              auth.uid() = id OR 
              EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'teacher'
              )
            );

          CREATE POLICY "服务端可以插入profile" ON profiles
            FOR INSERT WITH CHECK (true);

          CREATE POLICY "服务端可以更新所有profile" ON profiles
            FOR UPDATE USING (true);
        `)
      }
      return false
    }

    console.log('✅ Auth用户创建成功:', authData.user.id)

    console.log('\n2.2 创建profile记录...')
    const profileData = {
      id: authData.user.id,
      username: testUsername,
      email: testEmail,
      role: testRole,
      created_at: new Date().toISOString()
    }

    const { data: profileResult, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()

    if (profileError) {
      console.error('❌ 创建profile失败:', profileError)
      console.error('错误代码:', profileError.code)
      
      if (profileError.code === '42P01') {
        console.log('📋 profiles表不存在，需要先创建表结构')
      }
    } else {
      console.log('✅ Profile创建成功:', profileResult)
    }

    console.log('\n2.3 测试登录...')
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (sessionError) {
      console.error('❌ 登录测试失败:', sessionError)
    } else {
      console.log('✅ 登录测试成功')
      console.log('✅ 用户ID:', sessionData.user.id)
      console.log('✅ 邮箱:', sessionData.user.email)
    }

    console.log('\n🎉 测试完成！')

    return true

  } catch (error) {
    console.error('❌ 注册测试异常:', error)
    return false
  }
}

initDatabase()