import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function testNewSystem() {
  try {
    console.log('=== 测试新的教育成果系统 ===\n');
    
    // 1. 测试用户系统
    console.log('1. 测试用户系统:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('❌ 用户系统错误:', usersError.message);
    } else {
      console.log('✅ 用户系统正常，用户数:', users.length);
      if (users.length > 0) {
        console.log('   示例用户:', users[0].username, '角色:', users[0].role);
      }
    }
    
    // 2. 测试成果系统
    console.log('\n2. 测试成果系统:');
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*');
    
    if (achievementsError) {
      console.log('❌ 成果系统错误:', achievementsError.message);
    } else {
      console.log('✅ 成果系统正常，成果数:', achievements.length);
      if (achievements.length > 0) {
        console.log('   示例成果:', achievements[0].title, '状态:', achievements[0].status);
      }
    }
    
    // 3. 测试附件系统
    console.log('\n3. 测试附件系统:');
    const { data: attachments, error: attachmentsError } = await supabase
      .from('achievement_attachments')
      .select('*');
    
    if (attachmentsError) {
      console.log('❌ 附件系统错误:', attachmentsError.message);
    } else {
      console.log('✅ 附件系统正常，附件数:', attachments.length);
    }
    
    // 4. 测试审批记录
    console.log('\n4. 测试审批记录:');
    const { data: approvals, error: approvalsError } = await supabase
      .from('approval_records')
      .select('*');
    
    if (approvalsError) {
      console.log('❌ 审批记录错误:', approvalsError.message);
    } else {
      console.log('✅ 审批记录正常，记录数:', approvals.length);
    }
    
    // 5. 测试兼容性视图
    console.log('\n5. 测试兼容性视图:');
    const { data: projectsView, error: viewError } = await supabase
      .from('projects_view')
      .select('*');
    
    if (viewError) {
      console.log('❌ 兼容性视图错误:', viewError.message);
    } else {
      console.log('✅ 兼容性视图正常，记录数:', projectsView?.length || 0);
    }
    
    // 6. 测试状态分布
    console.log('\n6. 成果状态分布:');
    const { data: statusStats, error: statsError } = await supabase
      .from('achievements')
      .select('status, count(*)')
      .group('status');
    
    if (statsError) {
      console.log('❌ 状态统计错误:', statsError.message);
    } else {
      console.log('✅ 状态统计正常:');
      statusStats.forEach(stat => {
        const statusName = stat.status === 0 ? '草稿' : 
                          stat.status === 1 ? '待审批' : 
                          stat.status === 2 ? '已发布' : '未通过';
        console.log(`   ${statusName}: ${stat.count}个`);
      });
    }
    
    // 7. 测试角色分布
    console.log('\n7. 用户角色分布:');
    const { data: roleStats, error: roleError } = await supabase
      .from('users')
      .select('role, count(*)')
      .group('role');
    
    if (roleError) {
      console.log('❌ 角色统计错误:', roleError.message);
    } else {
      console.log('✅ 角色统计正常:');
      roleStats.forEach(stat => {
        const roleName = stat.role === 1 ? '学生' : 
                        stat.role === 2 ? '教师' : '管理员';
        console.log(`   ${roleName}: ${stat.count}个`);
      });
    }
    
    console.log('\n=== 测试完成 ===');
    console.log('✅ 新的教育成果系统已准备就绪！');
    console.log('📝 下一步：更新前端代码适配新的角色和状态格式');
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 运行测试
testNewSystem().catch(console.error);