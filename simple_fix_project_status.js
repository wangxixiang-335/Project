// 简单修复项目状态不一致问题
import { supabase } from './src/config/supabase.js';
import { PROJECT_STATUS } from './src/config/constants.js';

async function simpleFixProjectStatus() {
  console.log('=== 开始修复项目状态不一致问题 ===\n');

  try {
    // 1. 获取所有项目
    console.log('1. 获取所有项目...');
    const { data: allProjects, error } = await supabase
      .from('projects')
      .select('id, title, status, created_at, updated_at');

    if (error) {
      console.error('获取项目错误:', error);
      return;
    }

    console.log(`   找到 ${allProjects.length} 个项目`);

    // 2. 统计各状态项目数量
    const statusCount = allProjects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n2. 项目状态统计:');
    console.log('   - 待审核 (0):', statusCount[0] || 0);
    console.log('   - 已通过 (1):', statusCount[1] || 0);
    console.log('   - 已打回 (2):', statusCount[2] || 0);

    // 3. 找出问题："已打回"项目在"项目评审"中不显示
    //    因为"项目评审"只显示状态为0的项目
    console.log('\n3. 检查问题...');
    
    const rejectedProjects = allProjects.filter(p => p.status === 2);
    console.log(`   - 已打回项目数量: ${rejectedProjects.length}`);
    
    if (rejectedProjects.length > 0) {
      console.log('   - 已打回项目详情:');
      rejectedProjects.forEach(project => {
        console.log(`     ID: ${project.id}, 标题: "${project.title}", 提交时间: ${project.created_at}`);
      });
    }

    // 4. 修复方案：重置所有已打回项目为待审核状态
    console.log('\n4. 执行修复...');
    
    if (rejectedProjects.length > 0) {
      const projectIds = rejectedProjects.map(p => p.id);
      
      const { data: updatedProjects, error: updateError } = await supabase
        .from('projects')
        .update({ 
          status: PROJECT_STATUS.PENDING,
          updated_at: new Date().toISOString()
        })
        .in('id', projectIds)
        .select('id, title, status');

      if (updateError) {
        console.error('修复失败:', updateError);
        return;
      }

      console.log(`✅ 成功修复 ${updatedProjects.length} 个项目`);
      console.log('   修复后的项目:');
      updatedProjects.forEach(project => {
        console.log(`   - ID: ${project.id}, 标题: "${project.title}", 新状态: 待审核`);
      });
    } else {
      console.log('✅ 没有发现需要修复的项目');
    }

    console.log('\n=== 修复完成 ===');
    console.log('现在所有项目将在"项目评审"页面中正常显示');

  } catch (error) {
    console.error('修复过程中发生错误:', error);
  }
}

// 运行修复
simpleFixProjectStatus();