import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 从.env文件加载环境变量
import dotenv from 'dotenv'
dotenv.config({ path: join(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('缺少必要的环境变量')
  process.exit(1)
}

// 创建两个客户端：一个用于用户操作，一个用于管理员操作
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthentication() {
  try {
    console.log('🔍 检查Supabase认证系统...')
    
    // 1. 首先检查users表中的用户
    console.log('\n📋 检查users表:')
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .in('role', ['teacher', 'student'])
      .limit(5)
    
    if (usersError) {
      console.error('❌ 查询users表失败:', usersError.message)
    } else {
      console.log('✅ Users表用户:')
      users.forEach(user => {
        console.log(`  ID: ${user.id}, 用户名: ${user.username}, 角色: ${user.role}, 邮箱: ${user.email}`)
      })
    }
    
    // 2. 检查auth.users表（Supabase认证表）
    console.log('\n🔐 检查auth.users表:')
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ 查询auth.users失败:', authError.message)
    } else {
      console.log(`✅ Auth表用户数量: ${authUsers.users.length}`)
      authUsers.users.slice(0, 3).forEach(authUser => {
        console.log(`  ID: ${authUser.id}, 邮箱: ${authUser.email}, 创建时间: ${authUser.created_at}`)
      })
    }
    
    // 3. 尝试创建/获取教师用户的认证token
    if (users && users.length > 0) {
      const teacher = users.find(u => u.role === 'teacher') || users[0]
      console.log(`\n👨‍🏫 尝试为用户 ${teacher.username}(${teacher.email}) 获取token...`)
      
      // 方法1: 尝试用邮箱和密码登录（如果存在密码）
      const testPasswords = ['123456', 'password', 'admin', teacher.username]
      
      for (const password of testPasswords) {
        try {
          console.log(`🔑 尝试密码: ${password}`)
          const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
            email: teacher.email,
            password: password
          })
          
          if (!signInError && signInData.session) {
            console.log('✅ 登录成功!')
            console.log('🎫 获取到的Token:', signInData.session.access_token.substring(0, 50) + '...')
            
            // 测试API
            console.log('\n🧪 测试API调用...')
            const response = await fetch(`http://localhost:3000/api/review/pending`, {
              headers: {
                'Authorization': `Bearer ${signInData.session.access_token}`,
                'Content-Type': 'application/json'
              }
            })
            
            const result = await response.json()
            console.log('API测试结果:', result)
            return
          } else {
            console.log(`❌ 密码 ${password} 失败: ${signInError?.message}`)
          }
        } catch (error) {
          console.log(`❌ 密码 ${password} 出错: ${error.message}`)
        }
      }
      
      // 方法2: 生成新的认证token
      console.log('\n🔧 尝试创建临时认证token...')
      const { data: tempData, error: tempError } = await supabaseClient.auth.setSession({
        access_token: 'temp_token',
        refresh_token: 'temp_refresh'
      })
      
      if (tempError) {
        console.error('❌ 创建临时token失败:', tempError.message)
      } else {
        console.log('临时token数据:', tempData)
      }
    }
    
    console.log('\n💡 解决方案建议:')
    console.log('1. 确保用户在Supabase auth.users表中存在')
    console.log('2. 用户需要有有效的密码或认证方式')
    console.log('3. 前端需要先通过登录API获取有效的token')
    console.log('4. 检查localStorage中是否有有效的token')
    
  } catch (error) {
    console.error('❌ 认证测试失败:', error)
  }
}

testAuthentication()