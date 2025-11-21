import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// 创建Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createTestData() {
  console.log('🚀 开始创建测试数据...\n')

  try {
    // 1. 注册测试用户
    console.log('👥 创建测试用户...')
    
    const testUsers = [
      {
        email: 'student1@example.com',
        password: 'password123',
        username: '学生1号',
        role: 'student'
      },
      {
        email: 'student2@example.com',
        password: 'password123',
        username: '学生2号',
        role: 'student'
      },
      {
        email: 'teacher@example.com',
        password: 'password123',
        username: '教师账户',
        role: 'teacher'
      }
    ]

    for (const user of testUsers) {
      console.log(`创建用户: ${user.username} (${user.email})`)
      
      // 注册用户到Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (authError) {
        console.log(`用户 ${user.email} 可能已存在: ${authError.message}`)
        continue
      }

      // 创建profile记录
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: user.username,
          email: user.email,
          role: user.role
        })

      if (profileError) {
        console.log(`创建profile失败: ${profileError.message}`)
      } else {
        console.log(`✅ 用户 ${user.username} 创建成功`)
      }
    }

    // 2. 创建测试项目
    console.log('\n📁 创建测试项目...')
    
    // 先获取用户ID
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('role', 'student')

    if (usersError || !users.length) {
      console.log('❌ 无法获取学生用户')
      return
    }

    const testProjects = [
      {
        user_id: users[0].id,
        title: '个人博客网站',
        content_html: '<h2>项目介绍</h2><p>这是一个使用React和Node.js开发的个人博客网站，具有响应式设计。</p>',
        status: 1, // 已通过
        feedback: '项目完成度很高，界面美观'
      },
      {
        user_id: users[0].id,
        title: '在线商城系统',
        content_html: '<h2>商城功能</h2><p>包含用户注册、商品展示、购物车、订单管理等功能。</p>',
        status: 0, // 待审核
        feedback: ''
      },
      {
        user_id: users[1]?.id || users[0].id,
        title: '学生管理系统',
        content_html: '<h2>系统功能</h2><p>管理学生信息、成绩录入、课程安排等。</p>',
        status: 2, // 已打回
        feedback: '功能不够完善，建议增加更多功能模块'
      }
    ]

    for (const project of testProjects) {
      console.log(`创建项目: ${project.title}`)
      
      const { error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: project.user_id,
          title: project.title,
          content_html: project.content_html,
          status: project.status,
          feedback: project.feedback,
          view_count: Math.floor(Math.random() * 100)
        })

      if (projectError) {
        console.log(`创建项目失败: ${projectError.message}`)
      } else {
        console.log(`✅ 项目 ${project.title} 创建成功`)
      }
    }

    console.log('\n🎉 测试数据创建完成！')
    console.log('\n📋 测试账户信息:')
    console.log('- 学生1: student1@example.com / password123')
    console.log('- 学生2: student2@example.com / password123')  
    console.log('- 教师: teacher@example.com / password123')
    console.log('\n💡 现在可以登录系统测试不同角色的功能了！')

  } catch (error) {
    console.error('❌ 创建测试数据异常:', error)
  }
}

// 执行
createTestData()