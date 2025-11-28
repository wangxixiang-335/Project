import { supabase } from './src/config/supabase.js';

async function fixUsernameIssues() {
  console.log('🚀 开始修复用户名相关问题...\n');

  try {
    // 1. 检查并修复用户角色数据一致性
    console.log('📋 步骤1: 检查用户数据一致性');
    
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, username, role, created_at');
    
    if (usersError) {
      console.error('❌ 查询用户失败:', usersError);
      return;
    }

    console.log(`✅ 找到 ${allUsers.length} 个用户`);
    
    // 统计角色分布
    const roleStats = { 1: 0, 2: 0, 3: 0 };
    allUsers.forEach(user => {
      roleStats[user.role] = (roleStats[user.role] || 0) + 1;
    });
    
    console.log('角色分布:');
    console.log(`  👨‍🎓 学生 (role=1): ${roleStats[1] || 0}`);
    console.log(`  👨‍🏫 教师 (role=2): ${roleStats[2] || 0}`);
    console.log(`  👨‍💼 管理员 (role=3): ${roleStats[3] || 0}`);

    // 2. 检查成果数据关联
    console.log('\n📊 步骤2: 检查成果数据关联');
    
    const { data: achievements, error: achError } = await supabase
      .from('achievements')
      .select('id, title, publisher_id, status, created_at')
      .limit(10);
    
    if (achError) {
      console.error('❌ 查询成果失败:', achError);
    } else {
      console.log(`✅ 找到 ${achievements.length} 个成果样本`);
      
      // 检查发布者是否存在
      for (const achievement of achievements) {
        const { data: publisher, error: pubError } = await supabase
          .from('users')
          .select('id, username, role')
          .eq('id', achievement.publisher_id)
          .single();
        
        if (pubError || !publisher) {
          console.log(`⚠️  成果 ${achievement.id} 的发布者 ${achievement.publisher_id} 不存在`);
        } else {
          console.log(`✅ 成果 ${achievement.id}: ${achievement.title} -> 发布者: ${publisher.username} (role=${publisher.role})`);
        }
      }
    }

    // 3. 检查审批记录关联
    console.log('\n📝 步骤3: 检查审批记录关联');
    
    const { data: approvalRecords, error: apprError } = await supabase
      .from('approval_records')
      .select('id, achievement_id, reviewer_id, status, created_at')
      .limit(5);
    
    if (apprError) {
      console.error('❌ 查询审批记录失败:', apprError);
    } else if (!approvalRecords || approvalRecords.length === 0) {
      console.log('ℹ️  暂无审批记录');
    } else {
      console.log(`✅ 找到 ${approvalRecords.length} 条审批记录`);
      
      for (const record of approvalRecords) {
        // 检查审批者是否存在
        const { data: reviewer, error: revError } = await supabase
          .from('users')
          .select('id, username, role')
          .eq('id', record.reviewer_id)
          .single();
        
        if (revError || !reviewer) {
          console.log(`⚠️  审批记录 ${record.id} 的审批者 ${record.reviewer_id} 不存在`);
        } else {
          console.log(`✅ 审批记录 ${record.id}: 审批者 ${reviewer.username} (role=${reviewer.role})`);
        }
      }
    }

    // 4. 检查可能存在的数据不一致
    console.log('\n🔍 步骤4: 检查数据不一致问题');
    
    // 检查没有用户信息的成果
    const { data: orphanAchievements, error: orphanError } = await supabase
      .from('achievements')
      .select('id, title, publisher_id')
      .not('publisher_id', 'in', `(${allUsers.map(u => `'${u.id}'`).join(',')})`);
    
    if (orphanError) {
      console.error('❌ 查询孤儿成果失败:', orphanError);
    } else if (orphanAchievements && orphanAchievements.length > 0) {
      console.log(`⚠️  发现 ${orphanAchievements.length} 个孤儿成果（发布者不存在）`);
      orphanAchievements.forEach(ach => {
        console.log(`   - ${ach.id}: ${ach.title} (发布者: ${ach.publisher_id})`);
      });
    } else {
      console.log('✅ 没有发现孤儿成果');
    }

    // 5. 提供修复建议
    console.log('\n🔧 步骤5: 修复建议');
    
    // 检查用户名重复
    const usernames = allUsers.map(u => u.username);
    const duplicateUsernames = usernames.filter((name, index) => usernames.indexOf(name) !== index);
    
    if (duplicateUsernames.length > 0) {
      console.log(`⚠️  发现重复用户名: ${duplicateUsernames.join(', ')}`);
      console.log('建议: 确保用户名唯一性');
    } else {
      console.log('✅ 用户名唯一性检查通过');
    }

    // 6. 生成测试用户映射
    console.log('\n📋 步骤6: 用户映射表');
    console.log('当前用户映射:');
    allUsers.forEach(user => {
      const roleText = user.role === 1 ? '学生' : user.role === 2 ? '教师' : user.role === 3 ? '管理员' : '未知';
      console.log(`  ${user.id}: ${user.username} (${roleText})`);
    });

    console.log('\n✅ 用户名问题诊断完成');
    console.log('\n📌 建议下一步操作:');
    console.log('1. 检查前端是否正确使用用户ID进行API调用');
    console.log('2. 验证用户认证流程是否正常');
    console.log('3. 测试学生和教师功能是否分离正确');
    console.log('4. 检查是否有硬编码的用户名或ID');

  } catch (error) {
    console.error('❌ 修复过程出错:', error);
  }
}

// 运行修复
fixUsernameIssues().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ 修复失败:', err);
  process.exit(1);
});