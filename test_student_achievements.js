// 测试学生成果数据
import { supabase } from './src/config/supabase.js';

async function createTestAchievements() {
  console.log('=== 创建测试学生成果 ===');
  
  try {
    // 使用开发者学生ID
    const studentId = '34ec3e23-e273-4cc3-9def-322ca9389029';
    
    // 获取默认成果类型
    const { data: defaultType } = await supabase
      .from('achievement_types')
      .select('id')
      .limit(1)
      .single();
    
    const typeId = defaultType?.id || '00000000-0000-0000-0000-000000000000';
    
    // 创建测试成果数据
    const testAchievements = [
      {
        publisher_id: studentId,
        title: 'Web开发项目管理系统',
        description: '<p>这是一个基于React和Node.js的项目管理系统，支持任务分配、进度跟踪和团队协作功能。</p>',
        type_id: typeId,
        cover_url: 'https://via.placeholder.com/400x300/FF8C00/FFFFFF?text=Project+Management',
        video_url: '',
        status: 2, // 已发布
        score: 85,
        created_at: new Date('2024-01-15').toISOString()
      },
      {
        publisher_id: studentId,
        title: '移动学习应用',
        description: '<p>使用React Native开发的跨平台学习应用，包含课程管理、在线学习和成绩查询功能。</p>',
        type_id: typeId,
        cover_url: 'https://via.placeholder.com/400x300/007BFF/FFFFFF?text=Mobile+Learning',
        video_url: '',
        status: 1, // 待审核
        score: null,
        created_at: new Date('2024-02-20').toISOString()
      },
      {
        publisher_id: studentId,
        title: '数据分析平台',
        description: '<p>基于Python和Django的数据分析平台，支持数据可视化、报表生成和智能分析功能。</p>',
        type_id: typeId,
        cover_url: 'https://via.placeholder.com/400x300/28A745/FFFFFF?text=Data+Analytics',
        video_url: '',
        status: 3, // 已驳回
        score: null,
        created_at: new Date('2024-03-10').toISOString()
      }
    ];
    
    console.log('准备创建', testAchievements.length, '个测试成果...');
    
    // 逐个创建成果
    for (let i = 0; i < testAchievements.length; i++) {
      const achievement = testAchievements[i];
      
      const { data, error } = await supabase
        .from('achievements')
        .insert(achievement)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ 成果 ${i + 1} 创建失败:`, error);
      } else {
        console.log(`✅ 成果 ${i + 1} 创建成功:`, data.id);
        
        // 如果是被驳回的成果，添加审批记录
        if (achievement.status === 3) {
          const { error: approvalError } = await supabase
            .from('approval_records')
            .insert({
              achievement_id: data.id,
              reviewer_id: 'teacher-test-id',
              status: 2, // 驳回
              feedback: '项目功能不够完善，需要增加更多实际应用场景的测试数据。',
              reviewed_at: new Date().toISOString()
            });
          
          if (approvalError) {
            console.warn('审批记录创建失败:', approvalError.message);
          } else {
            console.log('  ✅ 审批记录创建成功');
          }
        }
      }
    }
    
    console.log('\n=== 验证成果创建结果 ===');
    
    // 查询该学生的所有成果
    const { data: studentAchievements, error: queryError } = await supabase
      .from('achievements')
      .select('*')
      .eq('publisher_id', studentId)
      .order('created_at', { ascending: false });
    
    if (queryError) {
      console.error('查询失败:', queryError);
    } else {
      console.log(`学生 ${studentId} 的成果列表:`);
      studentAchievements.forEach((achievement, index) => {
        const statusMap = {
          1: '待审核',
          2: '已发布',
          3: '已驳回'
        };
        console.log(`${index + 1}. ${achievement.title} - ${statusMap[achievement.status] || '未知'} (${achievement.created_at})`);
      });
    }
    
  } catch (error) {
    console.error('创建测试数据异常:', error.message);
  }
}

createTestAchievements();