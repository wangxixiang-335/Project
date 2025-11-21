import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://crwdfiwjfgrfurfhuizk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RmaXdqZmdyZnVyZmh1aXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA2MTA0MywiZXhwIjoyMDc4NjM3MDQzfQ.hFVv7qci6eGYmUT4p8b5ABFHZqdnmk318MIn1O_-ZnY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsers() {
  console.log('🔍 检查用户...')
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(10)
    
    if (error) {
      console.error('❌ 查询失败:', error.message)
    } else {
      console.log('✅ 用户列表:')
      data.forEach(user => {
        console.log(`  ID: ${user.id}, 用户名: ${user.username}, 角色: ${user.role}, 邮箱: ${user.email}`)
      })
    }
    
    // 检查auth用户
    console.log('\n🔐 检查认证用户...')
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ 查询auth用户失败:', authError.message)
    } else {
      console.log(`✅ Auth用户数量: ${authData.users.length}`)
      authData.users.slice(0, 3).forEach(user => {
        console.log(`  ID: ${user.id}, 邮箱: ${user.email}, 邮箱确认: ${user.email_confirmed_at ? '是' : '否'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message)
  }
}

checkUsers()