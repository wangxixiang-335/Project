import { supabase } from './src/config/supabase.js';

async function createSimpleLibraryData() {
  console.log('=== 创建简单的测试成果数据 ===\n');
  
  try {
    // 获取现有的学生用户
    const { data: students, error: studentError } = await supabase
      .from('users')
      .select('id, username')
      .eq('role', 1); // 学生角色
    
    // 获取成就类型
    const { data: types, error: typesError } = await supabase
      .from('achievement_types')
      .select('id, name');
    
    if (typesError) {
      console.log('❌ 获取成就类型失败:', typesError.message);
      return;
    }
    
    // 简化处理：使用第一个类型作为所有成果的类型
    const defaultTypeId = types && types.length > 0 ? types[0].id : null;
    console.log(`✅ 使用默认类型ID: ${defaultTypeId}`);
    
    if (studentError) {
      console.log('❌ 获取学生用户失败:', studentError.message);
      return;
    }
    
    if (!students || students.length === 0) {
      console.log('❌ 没有找到学生用户');
      return;
    }
    
    console.log(`✅ 找到 ${students.length} 个学生用户:`, students.map(s => s.username));
    
    // 为每个学生创建几个已通过的成果
    const achievements = [
      {
        title: '机器学习算法优化研究',
        description: '本研究针对传统机器学习算法在大数据处理中的性能瓶颈，提出了一种基于分布式计算的优化方案。通过实验验证，该方案在准确率基本保持不变的情况下，将处理速度提升了40%以上。',
        type_id: defaultTypeId,
        status: 2, // 已通过
        score: 95,
        publisher_id: students[0].id,
        instructor_id: null,
        created_at: new Date('2024-01-15').toISOString()
      },
      {
        title: '智能家居控制系统',
        description: '设计并实现了一套基于IoT技术的智能家居控制系统，包括环境监测、安防报警、远程控制等功能。系统采用模块化设计，具有良好的扩展性和用户体验。',
        type_id: defaultTypeId,
        status: 2, // 已通过
        score: 88,
        publisher_id: students[0].id,
        instructor_id: null,
        created_at: new Date('2024-01-18').toISOString()
      },
      {
        title: '响应式Web应用设计',
        description: '采用现代前端框架开发的响应式Web应用，实现了多设备适配和优秀的用户体验。包含用户管理、数据可视化、实时通信等核心功能模块。',
        type_id: defaultTypeId,
        status: 2, // 已通过
        score: 92,
        publisher_id: students[0].id,
        instructor_id: null,
        created_at: new Date('2024-01-20').toISOString()
      },
      {
        title: '数据可视化分析平台',
        description: '开发了一个集数据采集、处理、可视化分析于一体的综合性平台。支持多种数据源接入，提供丰富的图表类型和交互式分析功能。',
        type_id: defaultTypeId,
        status: 2, // 已通过
        score: 85,
        publisher_id: students[1]?.id || students[0].id,
        instructor_id: null,
        created_at: new Date('2024-01-22').toISOString()
      },
      {
        title: '移动学习应用开发',
        description: '针对移动学习场景设计的应用程序，整合了视频课程、在线测试、学习进度跟踪等功能。采用跨平台开发技术，确保良好的兼容性。',
        type_id: defaultTypeId,
        status: 2, // 已通过
        score: 90,
        publisher_id: students[1]?.id || students[0].id,
        instructor_id: null,
        created_at: new Date('2024-01-25').toISOString()
      }
    ];
    
    console.log(`\n🔧 开始创建 ${achievements.length} 个成果...`);
    
    for (const achievement of achievements) {
      try {
        // 检查是否已存在相同标题的成果
        const { data: existing } = await supabase
          .from('achievements')
          .select('id')
          .eq('title', achievement.title)
          .single();
        
        if (existing) {
          console.log(`⚠️ 成果已存在，跳过: ${achievement.title}`);
          continue;
        }
        
        // 插入成果
        const { data: achievementData, error: insertError } = await supabase
          .from('achievements')
          .insert(achievement)
          .select()
          .single();
        
        if (insertError) {
          console.log(`❌ 成果创建失败: ${achievement.title} - ${insertError.message}`);
          continue;
        }
        
        console.log(`✅ 成果创建成功: ${achievement.title} (ID: ${achievementData.id})`);
        
        // 创建审批记录
        const { error: approvalError } = await supabase
          .from('approval_records')
          .insert({
            achievement_id: achievementData.id,
            reviewer_id: achievement.publisher_id, // 简化处理
            status: 2, // 已通过
            feedback: '成果质量优秀，具有创新性和实用价值',
            reviewed_at: new Date().toISOString()
          });
        
        if (approvalError) {
          console.log(`❌ 审批记录创建失败: ${approvalError.message}`);
        } else {
          console.log(`✅ 审批记录创建成功: ${achievement.title}`);
        }
        
      } catch (error) {
        console.log(`❌ 创建成果异常: ${achievement.title} - ${error.message}`);
      }
    }
    
    // 验证创建结果
    console.log('\n🔍 验证创建结果...');
    const { data: finalAchievements, error: finalError } = await supabase
      .from('achievements')
      .select('id, title, score, status, publisher_id, created_at')
      .eq('status', 2) // 只查询已通过的
      .order('created_at', { ascending: false });
    
    if (finalError) {
      console.log('❌ 验证失败:', finalError.message);
    } else {
      console.log(`✅ 验证成功，当前成果库有 ${finalAchievements.length} 个成果:`);
      finalAchievements.forEach((achievement, index) => {
        console.log(`  ${index + 1}. ${achievement.title} - ${achievement.score}分 - 创建时间:${new Date(achievement.created_at).toLocaleDateString()}`);
      });
    }
    
  } catch (error) {
    console.log('❌ 创建测试数据过程中出现异常:', error.message);
  }
  
  console.log('\n=== 测试数据创建完成 ===');
  console.log('🎯 现在可以测试成果查看功能:');
  console.log('1. 访问: http://localhost:5173/teacher.html');
  console.log('2. 登录教师账号: teacher@example.com / password123');
  console.log('3. 点击"成果查看"查看已创建的测试成果');
  console.log('4. 点击"数据看板"查看统计图表');
  let finalAchievements = [];
  try {
    const result = await supabase
      .from('achievements')
      .select('id, title, score, status')
      .eq('status', 2) // 只查询已通过的
      .order('created_at', { ascending: false });
    
    if (!result.error) {
      finalAchievements = result.data || [];
    }
  } catch (e) {
    console.log('查询最终结果失败:', e.message);
  }
  
  console.log(`✅ 已创建的测试成果数量: ${finalAchievements?.length || 0}`);
}

createSimpleLibraryData().catch(console.error);