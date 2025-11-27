import { supabase } from './src/config/supabase.js';

async function checkCoverUrlData() {
  try {
    console.log('🔍 检查achievements表中cover_url字段的数据情况...\n');
    
    // 查询所有记录的cover_url字段
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('id, title, cover_url, video_url, status, created_at, publisher_id')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('查询错误:', error);
      return;
    }

    console.log(`📊 查询到 ${achievements.length} 条记录\n`);

    // 分类统计
    const stats = {
      total: achievements.length,
      hasCoverUrl: 0,
      placeholderCover: 0,
      nullCover: 0,
      emptyCover: 0,
      hasVideoUrl: 0
    };

    const placeholderPattern = /via\.placeholder\.com/;
    
    achievements.forEach((record, index) => {
      console.log(`\n${index + 1}. 成果ID: ${record.id}`);
      console.log(`   标题: ${record.title}`);
      console.log(`   cover_url: ${record.cover_url}`);
      console.log(`   video_url: ${record.video_url}`);
      console.log(`   状态: ${record.status}`);
      console.log(`   创建时间: ${record.created_at}`);
      console.log(`   发布者ID: ${record.publisher_id}`);

      if (record.cover_url) {
        stats.hasCoverUrl++;
        if (placeholderPattern.test(record.cover_url)) {
          stats.placeholderCover++;
          console.log(`   ⚠️  检测到占位符图片`);
        } else {
          console.log(`   ✅ 有自定义封面图`);
        }
      } else if (record.cover_url === null) {
        stats.nullCover++;
        console.log(`   ⚠️  cover_url为null`);
      } else if (record.cover_url === '') {
        stats.emptyCover++;
        console.log(`   ⚠️  cover_url为空字符串`);
      }

      if (record.video_url) {
        stats.hasVideoUrl++;
      }
    });

    console.log('\n📈 统计结果:');
    console.log(`总记录数: ${stats.total}`);
    console.log(`有cover_url: ${stats.hasCoverUrl}`);
    console.log(`占位符图片: ${stats.placeholderCover}`);
    console.log(`cover_url为null: ${stats.nullCover}`);
    console.log(`cover_url为空: ${stats.emptyCover}`);
    console.log(`有video_url: ${stats.hasVideoUrl}`);

    // 检查最近插入的记录
    console.log('\n🔍 检查最近插入的记录...');
    const recentRecords = achievements.slice(0, 10);
    const hasRecentPlaceholder = recentRecords.some(record => 
      record.cover_url && placeholderPattern.test(record.cover_url)
    );
    
    if (hasRecentPlaceholder) {
      console.log('⚠️  最近插入的记录中包含占位符图片');
    } else {
      console.log('✅ 最近插入的记录中没有占位符图片');
    }

    // 检查特定的占位符URL
    const specificPlaceholder = 'https://via.placeholder.com/400x300.png?text=成果封面图';
    const exactMatches = achievements.filter(record => record.cover_url === specificPlaceholder);
    
    console.log(`\n🔍 检查特定的占位符URL: ${specificPlaceholder}`);
    console.log(`完全匹配的记录数: ${exactMatches.length}`);
    
    if (exactMatches.length > 0) {
      console.log('匹配的记录ID:', exactMatches.map(r => r.id));
    }

  } catch (error) {
    console.error('检查失败:', error);
  }
}

// 运行检查
checkCoverUrlData();