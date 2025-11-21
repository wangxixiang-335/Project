import { supabaseAdmin } from './src/config/supabase.js'

console.log('开始初始化新数据库...')

async function initDatabase() {
  try {
    console.log('1. 测试数据库连接...')
    const { data, error } = await supabaseAdmin.from('profiles').select('id').limit(1)
    
    if (error && error.code === '42P01') {
      console.log('✅ 数据库连接正常，但表尚未创建')
    } else if (error) {
      console.error('❌ 数据库连接错误:', error)
      return
    } else {
      console.log('✅ 数据库连接正常')
    }

    console.log('\n2. 创建profiles表...')
    const createTableSQL = `
      -- 创建profiles表
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 创建索引
      CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
      CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

      -- 启用行级安全
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

      -- 创建RLS策略
      DROP POLICY IF EXISTS "用户可以查看自己的profile" ON profiles;
      CREATE POLICY "用户可以查看自己的profile" ON profiles
        FOR SELECT USING (auth.uid() = id);

      DROP POLICY IF EXISTS "用户可以更新自己的profile" ON profiles;
      CREATE POLICY "用户可以更新自己的profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);

      DROP POLICY IF EXISTS "教师可以查看所有用户profile" ON profiles;
      CREATE POLICY "教师可以查看所有用户profile" ON profiles
        FOR SELECT USING (
          auth.uid() = id OR 
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'teacher'
          )
        );

      DROP POLICY IF EXISTS "服务端可以插入profile" ON profiles;
      CREATE POLICY "服务端可以插入profile" ON profiles
        FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "服务端可以更新所有profile" ON profiles;
      CREATE POLICY "服务端可以更新所有profile" ON profiles
        FOR UPDATE USING (true);

      DROP POLICY IF EXISTS "服务端可以删除profile" ON profiles;
      CREATE POLICY "服务端可以删除profile" ON profiles
        FOR DELETE USING (true);
    `

    const { error: tableError } = await supabaseAdmin.rpc('exec_sql', { sql: createTableSQL })
    
    if (tableError && tableError.code !== 'PGRST302') {
      console.error('❌ 创建表失败:', tableError)
      
      // 如果直接执行失败，尝试分段执行
      console.log('尝试分段执行SQL...')
      await executeSQLStepByStep()
    } else {
      console.log('✅ profiles表创建成功')
    }

    console.log('\n3. 测试注册功能...')
    await testRegistration()

    console.log('\n🎉 数据库初始化完成！')

  } catch (error) {
    console.error('❌ 初始化过程中发生异常:', error)
  }
}

async function executeSQLStepByStep() {
  const sqlStatements = [
    // 创建表
    `CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // 创建索引
    `CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email)`,
    
    // 启用RLS
    `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`,
    
    // RLS策略
    `DROP POLICY IF EXISTS "用户可以查看自己的profile" ON profiles`,
    `CREATE POLICY "用户可以查看自己的profile" ON profiles
      FOR SELECT USING (auth.uid() = id)`,
    
    `DROP POLICY IF EXISTS "用户可以更新自己的profile" ON profiles`,
    `CREATE POLICY "用户可以更新自己的profile" ON profiles
      FOR UPDATE USING (auth.uid() = id)`,
    
    `DROP POLICY IF EXISTS "教师可以查看所有用户profile" ON profiles`,
    `CREATE POLICY "教师可以查看所有用户profile" ON profiles
      FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'teacher'
        )
      )`,
    
    `DROP POLICY IF EXISTS "服务端可以插入profile" ON profiles`,
    `CREATE POLICY "服务端可以插入profile" ON profiles
      FOR INSERT WITH CHECK (true)`,
    
    `DROP POLICY IF EXISTS "服务端可以更新所有profile" ON profiles`,
    `CREATE POLICY "服务端可以更新所有profile" ON profiles
      FOR UPDATE USING (true)`,
    
    `DROP POLICY IF EXISTS "服务端可以删除profile" ON profiles`,
    `CREATE POLICY "服务端可以删除profile" ON profiles
      FOR DELETE USING (true)`
  ]

  for (let i = 0; i < sqlStatements.length; i++) {
    try {
      console.log(`执行SQL语句 ${i + 1}/${sqlStatements.length}...`)
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlStatements[i] })
      
      if (error && !error.message.includes('already exists') && !error.message.includes('does not exist')) {
        console.error(`❌ 执行语句 ${i + 1} 失败:`, error)
      } else {
        console.log(`✅ 语句 ${i + 1} 执行成功`)
      }
    } catch (err) {
      console.error(`❌ 执行语句 ${i + 1} 异常:`, err)
    }
  }
}

async function testRegistration() {
  try {
    const testEmail = `test_${Date.now()}@test.com`
    const testPassword = 'test123456'
    const testUsername = 'testuser'
    const testRole = 'student'

    console.log('测试注册数据:', { testEmail })

    // 创建用户
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { role: testRole, username: testUsername }
    })

    if (authError) {
      console.error('❌ 创建用户失败:', authError)
      return false
    }

    console.log('✅ Auth用户创建成功:', authData.user.id)

    // 创建profile
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
      return false
    }

    console.log('✅ Profile创建成功:', profileResult)

    // 测试登录
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (sessionError) {
      console.error('❌ 登录测试失败:', sessionError)
    } else {
      console.log('✅ 登录测试成功')
    }

    return true

  } catch (error) {
    console.error('❌ 注册测试异常:', error)
    return false
  }
}

initDatabase()