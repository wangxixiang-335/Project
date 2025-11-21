import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUser() {
  try {
    console.log('🔍 检查数据库中的用户...')
    
    // 检查 auth.users 表
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      console.error('❌ 查询auth.users表失败:', authError.message)
    } else {
      console.log(`✅ auth.users表中找到 ${authUsers.users.length} 个用户`)
      if (authUsers.users.length > 0) {
        console.log('最新用户:', {
          id: authUsers.users[0].id,
          email: authUsers.users[0].email,
          created_at: authUsers.users[0].created_at,
          user_metadata: authUsers.users[0].user_metadata
        })
      }
    }

    // 检查 profiles 表
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (profileError) {
      console.error('❌ 查询profiles表失败:', profileError.message)
    } else {
      console.log(`✅ profiles表中找到 ${profiles.length} 个用户`)
      if (profiles.length > 0) {
        console.log('最新profile:', profiles[0])
      }
    }

    // 检查特定测试用户
    const testEmail = 'test1763001705144@example.com'
    console.log(`\n🔍 检查特定测试用户: ${testEmail}`)
    
    const { data: testUser, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single()

    if (testError) {
      console.log('❌ 未找到测试用户的profile记录')
    } else {
      console.log('✅ 找到测试用户的profile记录:', testUser)
    }

  } catch (error) {
    console.error('检查用户时出错:', error.message)
  }
}

checkUser()