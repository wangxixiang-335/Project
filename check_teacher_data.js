import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://lxhzphwoppmjdazxvqkr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aHpwaHdvcHBtamRhenh2cWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNjA2MTUsImV4cCI6MjA1MzYzNjYxNX0.W21s-TKGEjyrcpJt7bOA1Zv3EaP_U9wAPxkPZsM04Co');

async function checkUsersAndAchievements() {
  try {
    console.log('检查用户和成果数据...\n');
    
    // 检查教师用户
    const { data: teachers, error: teacherError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('role', 2);
    
    if (teacherError) throw teacherError;
    console.log('教师用户:');
    teachers.forEach(teacher => {
      console.log(`  ID: ${teacher.id}, 用户名: ${teacher.username}`);
    });
    
    // 检查成果数据
    const { data: achievements, error: achError } = await supabase
      .from('achievements')
      .select('id, title, publisher_id, status')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (achError) throw achError;
    
    console.log('\n成果数据:');
    for (const achievement of achievements) {
      const { data: publisher, error: pubError } = await supabase
        .from('users')
        .select('username, role')
        .eq('id', achievement.publisher_id)
        .single();
      
      if (!pubError && publisher) {
        console.log(`  成果: ${achievement.title}`);
        console.log(`    发布者: ${publisher.username} (${publisher.role === 1 ? '学生' : '教师'})`);
        console.log(`    状态: ${achievement.status}`);
      }
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  }
}

checkUsersAndAchievements();