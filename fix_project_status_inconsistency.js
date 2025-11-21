// 修复项目状态不一致问题
// 问题：有些项目被错误标记为已打回，但没有经过实际审核流程

import { supabase } from './src/config/supabase.js';
import { PROJECT_STATUS } from './src/config/constants.js';

async function fixProjectStatusInconsistency() {
  console.log('=== 开始修复项目状态不一致问题 ===\n');

  try {
    // 1. 找出所有被标记为已打回的项目
    console.log('1. 查找所有已打回项目...');
    const { data: rejectedProjects, error: rejectedError } = await supabase
      .from('projects')
      .select('id, title, status, created_at, updated_at, auditor_id, reject_reason')
      .eq('status', PROJECT_STATUS.REJECTED);

    if (rejectedError) {
      console.error('获取已打回项目错误:', rejectedError);
      return;
    }

    console.log(`   找到 ${rejectedProjects.length} 个已打回项目`);

    // 2. 找出可疑的项目（标记为已打回但没有审核信息）
    console.log('\n2. 识别可疑项目...');
    const suspiciousProjects = rejectedProjects.filter(project => 
      !project.auditor_id || !project.updated_at
    );

    console.log(`   发现 ${suspiciousProjects.length} 个可疑项目`);
    
    if (suspiciousProjects.length === 0) {
      console.log('✅ 没有发现可疑项目，数据状态正常');
      return;
    }

    // 3. 显示可疑项目详情
    console.log('\n3. 可疑项目详情:');
    suspiciousProjects.forEach(project => {
      console.log(`   - ID: ${project.id}, 标题: "${project.title}", 提交时间: ${project.created_at}`);
      console.log(`     审核人ID: ${project.auditor_id || '空'}, 更新时间: ${project.updated_at || '空'}`);
    });

    // 4. 修复：将这些项目重置为待审核状态
    console.log('\n4. 开始修复项目状态...');
    
    const projectIds = suspiciousProjects.map(p => p.id);
    const { data: updatedProjects, error: updateError } = await supabase
      .from('projects')
      .update({
        status: PROJECT_STATUS.PENDING,
        updated_at: null,
        auditor_id: null,
        reject_reason: null
      })
      .in('id', projectIds)
      .select('id, title, status');

    if (updateError) {
      console.error('修复项目状态错误:', updateError);
      return;
    }

    console.log(`✅ 成功修复 ${updatedProjects.length} 个项目状态`);
    console.log('   修复后的项目:');
    updatedProjects.forEach(project => {
      console.log(`   - ID: ${project.id}, 标题: "${project.title}", 新状态: 待审核`);
    });

    // 5. 验证修复结果
    console.log('\n5. 验证修复结果...');
    const { data: finalProjects, error: finalError } = await supabase
      .from('projects')
      .select('id, title, status')
      .in('id', projectIds);

    if (finalError) {
      console.error('验证修复结果错误:', finalError);
      return;
    }

    const fixedCount = finalProjects.filter(p => p.status === PROJECT_STATUS.PENDING).length;
    console.log(`✅ 验证完成：成功修复 ${fixedCount}/${suspiciousProjects.length} 个项目`);

    console.log('\n=== 修复完成 ===');
    console.log('现在这些项目将在"项目评审"页面中正常显示为待审核状态');

  } catch (error) {
    console.error('修复过程中发生错误:', error);
  }
}

// 运行修复
fixProjectStatusInconsistency();