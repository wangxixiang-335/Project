import { supabase } from './src/config/supabase.js';

async function checkUserRole() {
  try {
    const userId = 'b577f431-c4ba-4560-8e8e-f1a7819d313b'; // 从上面结果中获取的发布者ID
    
    console.log(`🔍 检查用户ID: ${userId} 的角色信息...\n`);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, role, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('查询用户错误:', error);
      return;
    }

    if (user) {
      console.log('👤 用户信息:');
      console.log(`   ID: ${user.id}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   角色: ${user.role} (1=学生, 2=教师, 3=管理员)`);
      console.log(`   创建时间: ${user.created_at}`);
      
      // 检查这个用户发布的所有成果
      console.log(`\n📊 检查该用户发布的所有成果...`);
      
      const { data: achievements, error: achError } = await supabase
        .from('achievements')
        .select('id, title, cover_url, video_url, status, created_at')
        .eq('publisher_id', userId)
        .order('created_at', { ascending: false });

      if (achError) {
        console.error('查询成果错误:', achError);
        return;
      }

      console.log(`该用户共发布了 ${achievements.length} 个成果:`);
      
      achievements.forEach((achievement, index) => {
        console.log(`\n${index + 1}. 成果ID: ${achievement.id}`);
        console.log(`   标题: ${achievement.title}`);
        console.log(`   cover_url: ${achievement.cover_url}`);
        console.log(`   video_url: ${achievement.video_url}`);
        console.log(`   状态: ${achievement.status}`);
        console.log(`   创建时间: ${achievement.created_at}`);
        
        if (achievement.cover_url && achievement.cover_url.includes('placeholder.com')) {
          console.log(`   ⚠️  这是占位符图片`);
        }
      });
      
    } else {
      console.log('未找到该用户');
    }

  } catch (error) {
    console.error('检查失败:', error);
  }
}

// 运行检查
checkUserRole();