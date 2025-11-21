import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testRegistration() {
  try {
    console.log('🧪 测试注册并查看详细过程...')

    // 模拟完整的注册流程，包含详细的调试信息
    const testEmail = `test${Date.now()}@example.com`
    const testPassword = 'test123456'
    const testUsername = '测试用户'
    const testRole = 'student'

    console.log(`\n📧 开始注册用户: ${testEmail}`)

    // 1. 创建Supabase Auth用户
    console.log('1️⃣ 创建Auth用户...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { role: testRole, username: testUsername }
    })

    if (authError) {
      console.error('❌ 创建Auth用户失败:', authError.message)
      return
    }

    console.log('✅ Auth用户创建成功，ID:', authData.user.id)

    // 2. 创建profile记录
    console.log('\n2️⃣ 创建profile记录...')
    
    const profileData = {
      id: authData.user.id,
      username: testUsername,
      role: testRole
    }

    console.log('📋 Profile数据:', profileData)

    const { data: profileResult, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error('❌ 创建profile失败:')
      console.error('  错误消息:', profileError.message)
      console.error('  错误代码:', profileError.code)
      console.error('  错误详情:', profileError)
    } else {
      console.log('✅ Profile创建成功:', profileResult)
    }

    // 3. 验证结果
    console.log('\n3️⃣ 验证结果...')
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (verifyError) {
      console.error('❌ 验证失败:', verifyError.message)
    } else {
      console.log('✅ 找到profile记录:', verifyData)
    }

    // 4. 清理测试数据
    console.log('\n🧹 清理测试数据...')
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    if (!profileError) {
      await supabaseAdmin.from('profiles').delete().eq('id', authData.user.id)
    }
    console.log('✅ 测试数据已清理')

    console.log('\n🎉 测试完成！')

  } catch (error) {
    console.error('❌ 测试过程出错:', error.message)
  }
}

testRegistration()