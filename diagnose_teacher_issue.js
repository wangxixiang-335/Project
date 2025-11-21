import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnoseTeacherIssue() {
  console.log('🔍 诊断教师端问题...\n')

  try {
    // 1. 检查数据库中的实际项目状态
    console.log('📊 检查数据库中的项目状态:')
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('id, title, status, created_at')

    if (allError) {
      console.log('❌ 查询所有项目失败:', allError.message)
      return
    }

    console.log(`✅ 总项目数: ${allProjects?.length || 0}`)
    
    const statusCounts = {}
    allProjects?.forEach(project => {
      statusCounts[project.status] = (statusCounts[project.status] || 0) + 1
    })
    
    console.log('📋 项目状态分布:')
    Object.keys(statusCounts).forEach(status => {
      const statusText = status === '0' ? '待审核' : status === '1' ? '已通过' : status === '2' ? '已打回' : `未知(${status})`
      console.log(`  - ${statusText}: ${statusCounts[status]} 个`)
    })

    // 2. 检查是否有待审核项目
    console.log('\n🔍 检查待审核项目:')
    const { data: pendingProjects, error: pendingError } = await supabase
      .from('projects')
      .select('id, title, status')
      .eq('status', 0)

    if (pendingError) {
      console.log('❌ 查询待审核项目失败:', pendingError.message)
    } else {
      console.log(`✅ 待审核项目数: ${pendingProjects?.length || 0}`)
      if (pendingProjects?.length > 0) {
        pendingProjects.forEach(project => {
          console.log(`  - ${project.title} (ID: ${project.id})`)
        })
      }
    }

    // 3. 检查profiles表连接
    console.log('\n👥 检查用户数据连接:')
    const { data: projectsWithUsers, error: joinError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        status,
        profiles:user_id (username)
      `)
      .limit(5)

    if (joinError) {
      console.log('❌ 连接查询失败:', joinError.message)
    } else {
      console.log(`✅ 连接查询成功，示例数据:`)
      projectsWithUsers?.forEach(project => {
        console.log(`  - ${project.title} (状态: ${project.status}) - 作者: ${project.profiles?.username || '未知'}`)
      })
    }

    // 4. 模拟统计API的查询
    console.log('\n📈 模拟统计API查询:')
    const { count: totalCount, error: totalError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })

    const { count: pendingCount, error: pendingCountError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 0)

    if (totalError) {
      console.log('❌ 统计查询失败:', totalError.message)
    } else {
      console.log(`✅ 统计结果:
  - 总项目数: ${totalCount || 0}
  - 待审核数: ${pendingCount || 0}`)
    }

    // 5. 检查数据库表结构
    console.log('\n🏗️ 检查表结构:')
    const { data: tableInfo, error: tableError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)

    if (tableError) {
      console.log('❌ 表结构查询失败:', tableError.message)
    } else if (tableInfo?.length > 0) {
      console.log('✅ 表结构正常，字段包括:', Object.keys(tableInfo[0]))
    }

  } catch (error) {
    console.error('❌ 诊断过程中出错:', error)
  }
}

// 执行诊断
diagnoseTeacherIssue()