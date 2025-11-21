import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://crwdfiwjfgrfurfhuizk.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RmaXdqZmdyZnVyZmh1aXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA2MTA0MywiZXhwIjoyMDc4NjM3MDQzfQ.hFVv7qci6eGYmUT4p8b5ABFHZqdnmk318MIn1O_-ZnY'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function createAuthSolution() {
  console.log('🔧 创建认证解决方案...')
  
  try {
    // 1. 创建一个新的教师用户，带密码
    console.log('👨‍🏫 创建教师认证用户...')
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'testteacher123@example.com',
      password: '123456',
      email_confirm: true,
      user_metadata: {
        username: 'testteacher',
        role: 'teacher'
      }
    })
    
    if (createError && !createError.message.includes('already registered')) {
      console.log('❌ 创建用户失败:', createError.message)
    } else {
      console.log('✅ 教师用户创建成功')
    }
    
    // 2. 登录这个新用户
    console.log('🔑 登录新用户...')
    
    // 为了测试，我们直接使用临时token的方式
    console.log('\n📋 解决方案:')
    console.log('1. 后端API正常工作，问题在于前端需要有效的Supabase token')
    console.log('2. 用户必须先通过Supabase Auth登录')
    console.log('3. 前端需要使用正确的认证流程')
    
    console.log('\n🎯 临时解决方案:')
    console.log('1. 在前端登录页面使用以下凭据:')
    console.log('   邮箱: testteacher123@example.com')
    console.log('   密码: 123456')
    console.log('2. 登录成功后，token会自动存储到localStorage')
    console.log('3. 然后教师审核功能就能正常使用')
    
    console.log('\n🔍 检查当前用户状态...')
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    
    const teacherUsers = users.users.filter(u => 
      u.user_metadata?.role === 'teacher' || 
      u.email?.includes('teacher')
    )
    
    console.log(`✅ 找到 ${teacherUsers.length} 个教师认证用户:`)
    teacherUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.user_metadata?.role || 'unknown'})`)
    })
    
    // 3. 提供一个测试token生成器
    console.log('\n🔧 创建临时测试token...')
    
    const testTeacher = teacherUsers[0]
    if (testTeacher) {
      console.log('✅ 找到测试教师:', testTeacher.email)
      
      // 生成一个临时session token（仅用于测试）
      console.log('🎫 测试token生成方法:')
      console.log('1. 在浏览器开发者工具中运行:')
      console.log(`
const supabaseUrl = 'https://crwdfiwjfgrfurfhuizk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RmaXdqZmdyZnVyZmh1aXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjEwNDMsImV4cCI6MjA3ODYzNzA0M30.xJE5RKMkINBpuU0xvMEDWtu78Gl9_SJAEmJJdQ0G4wU'

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabase = createClient(supabaseUrl, supabaseKey)

// 登录获取token
const { data, error } = await supabase.auth.signInWithPassword({
  email: '${testTeacher.email}',
  password: '123456'  // 或其他已知密码
})

if (data.session) {
  localStorage.setItem('token', data.session.access_token)
  console.log('Token已设置:', data.session.access_token)
}
      `)
    }
    
  } catch (error) {
    console.error('❌ 解决方案创建失败:', error.message)
  }
}

createAuthSolution()