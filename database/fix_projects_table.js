import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// 创建Supabase管理客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixProjectsTable() {
  console.log('🔧 开始修复projects表结构...\n')

  try {
    // 1. 检查当前表结构
    console.log('📊 检查当前projects表结构...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'projects')

    if (tablesError) {
      console.error('❌ 无法获取表结构:', tablesError)
      return
    }

    console.log('当前projects表字段:')
    tables.forEach(col => console.log('  - ' + col.column_name + ' (' + col.data_type + ')'))

    // 2. 添加缺失的字段
    console.log('\n➕ 添加缺失字段...')
    
    const alterStatements = [
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS content_html TEXT',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS images_array TEXT[]',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS video_url TEXT',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS feedback TEXT',
    // 修改status字段为整数类型（如果存在）
    "ALTER TABLE projects ALTER COLUMN status TYPE INTEGER USING CASE WHEN status = 'pending' THEN 0 WHEN status = 'approved' THEN 1 WHEN status = 'rejected' THEN 2 ELSE 0 END"
    ]

    for (const sql of alterStatements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql })
        if (error && !error.message.includes('already exists') && !error.message.includes('does not exist')) {
          console.error(`❌ 执行SQL失败: ${error.message}`)
        } else {
          console.log(`✅ 执行: ${sql.split(' ').slice(0, 6).join(' ')}...`)
        }
      } catch (err) {
        console.log(`⚠️  跳过: ${err.message}`)
      }
    }

    // 3. 添加示例数据
    console.log('\n📝 添加示例数据...')
    
    // 获取学生用户ID
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student')
      .limit(2)

    if (studentsError || !students.length) {
      console.log('❌ 无法获取学生用户')
      return
    }

    const sampleProjects = [
      {
        user_id: students[0].id,
        title: '个人博客网站',
        content_html: '<h2>项目介绍</h2><p>这是一个使用React和Node.js开发的个人博客网站，具有响应式设计。</p>',
        video_url: '',
        status: 1, // 已通过
        feedback: '项目完成度很高，界面美观'
      },
      {
        user_id: students[0].id,
        title: '在线商城系统', 
        content_html: '<h2>商城功能</h2><p>包含用户注册、商品展示、购物车、订单管理等功能。</p>',
        video_url: '',
        status: 0, // 待审核
        feedback: ''
      },
      {
        user_id: students[1]?.id || students[0].id,
        title: '学生管理系统',
        content_html: '<h2>系统功能</h2><p>管理学生信息、成绩录入、课程安排等。</p>',
        video_url: '',
        status: 2, // 已打回
        feedback: '功能不够完善，建议增加更多功能模块'
      }
    ]

    for (const project of sampleProjects) {
      const { error: insertError } = await supabase
        .from('projects')
        .insert(project)

      if (insertError) {
        console.log(`❌ 插入项目失败: ${insertError.message}`)
      } else {
        console.log(`✅ 项目 "${project.title}" 添加成功`)
      }
    }

    console.log('\n🎉 projects表结构修复完成！')
    console.log('💡 现在可以测试教师和学生角色的功能了！')

  } catch (error) {
    console.error('❌ 修复表结构异常:', error)
  }
}

// 执行
fixProjectsTable()