import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://crwdfiwjfgrfurfhuizk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RmaXdqZmdyZnVyZmh1aXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA2MTA0MywiZXhwIjoyMDc4NjM3MDQzfQ.hFVv7qci6eGYmUT4p8b5ABFHZqdnmk318MIn1O_-ZnY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAuthMetadata() {
  console.log('🔧 修复认证元数据...')
  
  try {
    // 1. 获取所有users表的用户
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
    
    if (dbError) {
      console.error('❌ 获取数据库用户失败:', dbError.message)
      return
    }
    
    console.log(`✅ 找到 ${dbUsers.length} 个数据库用户`)
    
    // 2. 获取所有auth用户
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ 获取认证用户失败:', authError.message)
      return
    }
    
    console.log(`✅ 找到 ${authData.users.length} 个认证用户`)
    
    // 3. 创建用户映射
    const dbUserMap = {}
    dbUsers.forEach(dbUser => {
      dbUserMap[dbUser.username] = dbUser
    })
    
    // 4. 为每个auth用户更新metadata
    for (const authUser of authData.users) {
      const username = authUser.user_metadata?.username || authUser.email?.split('@')[0]
      const dbUser = dbUserMap[username]
      
      if (dbUser) {
        // 映射角色数字到字符串
        const roleString = dbUser.role === 2 ? 'teacher' : 'student'
        
        console.log(`🔄 更新用户 ${username}: ${authUser.email}`)
        console.log(`   当前metadata:`, authUser.user_metadata)
        console.log(`   将设置角色: ${roleString} (数据库role: ${dbUser.role})`)
        
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
          authUser.id,
          {
            user_metadata: {
              ...authUser.user_metadata,
              role: roleString,
              username: dbUser.username
            }
          }
        )
        
        if (updateError) {
          console.error(`❌ 更新用户 ${username} 失败:`, updateError.message)
        } else {
          console.log(`✅ 用户 ${username} 更新成功`)
          
          // 测试登录
          if (roleString === 'teacher') {
            console.log(`🧪 测试教师 ${username} 的API访问...`)
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: authUser.email,
              password: '123456' // 尝试常见密码
            }).catch(() => ({ data: null }))
            
            if (signInData?.session) {
              console.log(`🎫 获取到token: ${signInData.session.access_token.substring(0, 50)}...`)
              
              // 测试API
              try {
                const apiResponse = await fetch('http://localhost:3000/api/review/pending', {
                  headers: {
                    'Authorization': `Bearer ${signInData.session.access_token}`,
                    'Content-Type': 'application/json'
                  }
                })
                const apiResult = await apiResponse.json()
                console.log(`📡 API测试结果:`, apiResult)
              } catch (apiError) {
                console.log(`📡 API测试失败:`, apiError.message)
              }
            } else {
              console.log(`🔑 用户 ${username} 登录失败，可能是密码问题`)
            }
          }
        }
      } else {
        console.log(`⚠️  认证用户 ${authUser.email} 没有对应的数据库记录`)
      }
    }
    
    console.log('\n💡 如果登录失败，需要：')
    console.log('1. 为用户设置正确的密码')
    console.log('2. 或者在前端使用邮箱验证登录')
    console.log('3. 检查前端是否正确存储token到localStorage')
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message)
  }
}

fixAuthMetadata()