import { supabase } from './src/config/supabase.js';

async function checkDbData() {
  try {
    console.log('=== 检查数据库实际数据 ===\n');
    
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('id, title, status, publisher_id, created_at')
      .neq('status', 0) // 排除草稿
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ 查询失败:', error.message);
      return;
    }
    
    console.log('📋 数据库中的学生成果:');
    achievements.forEach((d, i) => {
      const statusText = d.status === 1 ? '待审核' : d.status === 2 ? '已通过' : d.status === 3 ? '已打回' : '草稿';
      console.log(`${i+1}. ${d.title}`);
      console.log(`   状态: ${statusText} (${d.status})`);
      console.log(`   发布者ID: ${d.publisher_id}`);
      console.log(`   创建时间: ${d.created_at}`);
      console.log('---');
    });
    
    // 获取用户信息
    const publisherIds = [...new Set(achievements.map(a => a.publisher_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, username, role')
      .in('id', publisherIds);
    
    console.log('👥 相关用户信息:');
    users.forEach(user => {
      const roleText = user.role === 1 ? '学生' : user.role === 2 ? '教师' : '管理员';
      console.log(`- ${user.username} (${roleText}) - ID: ${user.id}`);
    });
    
    console.log('\n🎯 数据总结:');
    console.log(`- 总成果数: ${achievements.length}`);
    console.log(`- 待审核: ${achievements.filter(a => a.status === 1).length}`);
    console.log(`- 已通过: ${achievements.filter(a => a.status === 2).length}`);
    console.log(`- 已打回: ${achievements.filter(a => a.status === 3).length}`);
    console.log(`- 草稿: ${achievements.filter(a => a.status === 0).length}`);
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkDbData();