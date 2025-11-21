import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://crwdfiwjfgrfurfhuizk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RmaXdqZmdyZnVyZmh1aXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjEwNDMsImV4cCI6MjA3ODYzNzA0M30.xJE5RKMkINBpuU0xvMEDWtu78Gl9_SJAEmJJdQ0G4wU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLoginAndGetToken() {
  console.log('🔑 测试登录获取Token...')
  
  // 先尝试创建一个测试教师用户
  console.log('\n👨‍🏫 创建/登录测试教师...')
  
  // 尝试注册
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'teacher@test.com',
    password: '123456',
    options: {
      data: {
        username: 'testteacher',
        role: 'teacher'
      }
    }
  })
  
  if (signUpError && !signUpError.message.includes('already registered')) {
    console.log('❌ 注册失败:', signUpError.message)
  } else {
    console.log('✅ 用户注册成功或已存在')
  }
  
  // 尝试登录
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'teacher@test.com',
    password: '123456'
  })
  
  if (signInError) {
    console.log('❌ 登录失败:', signInError.message)
    
    // 如果新用户登录失败，尝试已有用户
    console.log('\n🔄 尝试已有教师用户...')
    const { data: existingData, error: existingError } = await supabase.auth.signInWithPassword({
      email: 'teacher1@example.com',
      password: '123456'
    })
    
    if (existingError) {
      console.log('❌ 现有用户登录失败:', existingError.message)
      return
    }
    
    console.log('✅ 现有教师登录成功!')
    console.log('🎫 Token:', existingData.session.access_token)
    console.log('👤 用户信息:', {
      id: existingData.user.id,
      email: existingData.user.email,
      role: existingData.user.user_metadata?.role
    })
    
    // 测试API
    console.log('\n🧪 测试API访问...')
    try {
      const response = await fetch('http://localhost:3000/api/review/pending', {
        headers: {
          'Authorization': `Bearer ${existingData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      console.log('📡 API测试结果:', result)
      
    } catch (apiError) {
      console.log('❌ API测试失败:', apiError.message)
    }
    
  } else {
    console.log('✅ 测试教师登录成功!')
    console.log('🎫 Token:', signInData.session.access_token)
    console.log('👤 用户信息:', {
      id: signInData.user.id,
      email: signInData.user.email,
      role: signInData.user.user_metadata?.role
    })
  }
  
  console.log('\n📋 前端使用说明:')
  console.log('1. 在浏览器localStorage中设置token:')
  console.log(`localStorage.setItem('token', 'your_token_here')`)
  console.log('2. 或者通过登录页面获取token')
  console.log('3. 然后访问教师审核页面')
}

testLoginAndGetToken()