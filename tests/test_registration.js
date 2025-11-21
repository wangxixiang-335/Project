import { supabaseAdmin } from './src/config/supabase.js'

console.log('开始测试用户注册...')

async function testRegistration() {
  try {
    const testEmail = `test_${Date.now()}@test.com`
    const testPassword = 'test123456'
    const testUsername = 'testuser'
    const testRole = 'student'

    console.log('测试数据:', { testEmail, testPassword, testUsername, testRole })

    // 1. 测试创建用户
    console.log('\n1. 测试创建Supabase Auth用户...')
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
      return
    }

    console.log('✅ Auth用户创建成功:', authData.user.id)

    // 2. 测试创建profile记录
    console.log('\n2. 测试创建profile记录...')
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
      console.error('错误详情:', profileError.message)
    } else {
      console.log('✅ Profile创建成功:', profileResult)
    }

    // 3. 测试登录
    console.log('\n3. 测试用户登录...')
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (sessionError) {
      console.error('❌ 登录失败:', sessionError)
    } else {
      console.log('✅ 登录成功，token:', sessionData.session.access_token.substring(0, 20) + '...')
    }

    console.log('\n✅ 测试完成')

  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error)
    console.error('堆栈:', error.stack)
  }
}

testRegistration()