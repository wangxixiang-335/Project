import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixProjectTitles() {
  console.log('🔧 修复项目标题问题...\n')

  try {
    // 1. 检查当前所有项目
    console.log('📊 检查当前项目数据:')
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('id, title, status, created_at')

    if (allError) {
      console.log('❌ 查询项目失败:', allError.message)
      return
    }

    console.log(`✅ 找到 ${allProjects?.length || 0} 个项目`)

    // 2. 检查需要修复的项目
    const projectsToFix = allProjects?.filter(project => 
      !project.title || 
      project.title.trim() === '' || 
      project.title === '1' || 
      project.title === '0'
    )

    console.log(`🛠️ 需要修复的项目数: ${projectsToFix?.length || 0}`)

    if (projectsToFix?.length === 0) {
      console.log('✅ 没有需要修复的项目')
      return
    }

    // 3. 修复项目标题
    for (const project of projectsToFix) {
      console.log(`\n🔧 修复项目: ${project.id}`)
      console.log(`  原标题: "${project.title}"`)
      
      // 生成新的标题
      const newTitle = `项目-${new Date(project.created_at).toLocaleDateString('zh-CN')}`
      
      const { error: updateError } = await supabase
        .from('projects')
        .update({ title: newTitle })
        .eq('id', project.id)

      if (updateError) {
        console.log(`❌ 修复失败: ${updateError.message}`)
      } else {
        console.log(`✅ 修复成功，新标题: "${newTitle}"`)
      }
    }

    // 4. 验证修复结果
    console.log('\n🔍 验证修复结果:')
    const { data: fixedProjects, error: verifyError } = await supabase
      .from('projects')
      .select('id, title, status')

    if (verifyError) {
      console.log('❌ 验证失败:', verifyError.message)
    } else {
      console.log('✅ 所有项目当前标题:')
      fixedProjects?.forEach(project => {
        console.log(`  - ID: ${project.id} | 标题: "${project.title}" | 状态: ${project.status}`)
      })
    }

    console.log('\n🎉 修复完成！')

  } catch (error) {
    console.error('❌ 修复过程中出错:', error)
  }
}

// 执行修复
fixProjectTitles()