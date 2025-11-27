import { supabase } from './src/config/supabase.js';

async function checkAchievementCreation() {
  try {
    // 检查最近创建的带有占位符的成果
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('id, title, cover_url, video_url, status, created_at, publisher_id, description')
      .like('cover_url', '%via.placeholder.com%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('查询错误:', error);
      return;
    }

    console.log(`🔍 找到 ${achievements.length} 个使用占位符的成果\n`);

    // 检查每个成果的详细信息
    for (const achievement of achievements) {
      console.log(`\n📋 成果详情:`);
      console.log(`   ID: ${achievement.id}`);
      console.log(`   标题: ${achievement.title}`);
      console.log(`   cover_url: ${achievement.cover_url}`);
      console.log(`   video_url: ${achievement.video_url}`);
      console.log(`   状态: ${achievement.status}`);
      console.log(`   创建时间: ${achievement.created_at}`);
      console.log(`   发布者ID: ${achievement.publisher_id}`);
      
      // 从描述中提取可能的图片URL
      const description = achievement.description || '';
      const imgMatches = description.match(/<img[^>]+src="([^"]+)"/g);
      
      if (imgMatches && imgMatches.length > 0) {
        console.log(`   📸 内容中的图片:`);
        imgMatches.forEach((match, index) => {
          const src = match.match(/src="([^"]+)"/)[1];
          console.log(`      ${index + 1}. ${src}`);
        });
      }
      
      // 检查是否有审批记录
      const { data: approvalRecords, error: approvalError } = await supabase
        .from('approval_records')
        .select('*')
        .eq('achievement_id', achievement.id);

      if (approvalError) {
        console.log(`   ⚠️  查询审批记录失败: ${approvalError.message}`);
      } else if (approvalRecords && approvalRecords.length > 0) {
        console.log(`   📋 审批记录 (${approvalRecords.length}条):`);
        approvalRecords.forEach((record, index) => {
          console.log(`      ${index + 1}. 状态: ${record.status}, 审批人: ${record.reviewer_id}, 时间: ${record.reviewed_at}`);
        });
      } else {
        console.log(`   📋 无审批记录`);
      }
      
      // 检查附件
      const { data: attachments, error: attachmentError } = await supabase
        .from('achievement_attachments')
        .select('*')
        .eq('achievement_id', achievement.id);

      if (attachmentError) {
        console.log(`   ⚠️  查询附件失败: ${attachmentError.message}`);
      } else if (attachments && attachments.length > 0) {
        console.log(`   📎 附件 (${attachments.length}个):`);
        attachments.forEach((attachment, index) => {
          console.log(`      ${index + 1}. ${attachment.file_name}: ${attachment.file_url}`);
        });
      } else {
        console.log(`   📎 无附件`);
      }
      
      // 尝试推测创建方式
      if (achievement.status === 2) { // 已通过
        if (approvalRecords && approvalRecords.length > 0) {
          console.log(`   🔍 推测: 通过审批流程创建`);
        } else {
          console.log(`   🔍 推测: 教师直接发布（无审批记录）`);
        }
      } else if (achievement.status === 1) { // 待审批
        console.log(`   🔍 推测: 学生提交，待审批`);
      }
    }

  } catch (error) {
    console.error('检查失败:', error);
  }
}

// 运行检查
checkAchievementCreation();