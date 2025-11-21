import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugRegistration() {
  try {
    console.log('🔍 调试注册问题...')

    // 模拟注册流程
    const testEmail = `debug${Date.now()}@example.com`
    const testPassword = 'debug123456'
    const testUsername = '调试用户'
    const testRole = 'student'

    console.log(`\n📧 创建用户: ${testEmail}`)

    // 1. 创建Auth用户
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

    // 2. 尝试创建profile记录
    console.log('\n📋 尝试创建profile记录...')
    
    // 使用服务端权限
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: testUsername,
        email: testEmail,
        role: testRole
      })
      .select()

    if (profileError) {
      console.error('❌ 创建profile失败:')
      console.error('错误消息:', profileError.message)
      console.error('错误代码:', profileError.code)
      console.error('错误详情:', profileError)
      
      // 尝试获取更详细的错误信息
      if (profileError.message.includes('column')) {
        console.log('\n🔍 看起来是列结构问题，让我们检查实际的列...')
        
        // 尝试只插入必需的字段
        console.log('尝试只插入id和username...')
        const { data: simpleData, error: simpleError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: testUsername
          })
          .select()

        if (simpleError) {
          console.error('简化插入也失败:', simpleError.message)
        } else {
          console.log('✅ 简化插入成功:', simpleData)
        }
      }
    } else {
      console.log('✅ Profile创建成功:', profileData)
    }

    // 3. 验证结果
    console.log('\n✅ 验证结果...')
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
    await supabaseAdmin.from('profiles').delete().eq('id', authData.user.id)
    console.log('✅ 测试数据已清理')

  } catch (error) {
    console.error('❌ 调试过程出错:', error.message)
  }
}

debugRegistration()