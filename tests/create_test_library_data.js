import { supabase } from './src/config/supabase.js';

async function createTestLibraryData() {
  console.log('=== 创建测试成果库数据 ===\n');
  
  try {
    // 1. 创建测试学生用户
    console.log('1️⃣ 创建测试学生...');
    const students = [
      { username: 'test_student_1', email: 'student1@test.com', password: 'password123' },
      { username: 'test_student_2', email: 'student2@test.com', password: 'password123' },
      { username: 'test_student_3', email: 'student3@test.com', password: 'password123' }
    ];
    
    const createdStudents = [];
    
    for (const student of students) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: student.email,
          password: student.password,
          email_confirm: true,
          user_metadata: {
            role: 'student',
            username: student.username
          }
        });
        
        if (authError) {
          console.log(`⚠️ 学生 ${student.username} 已存在:`, authError.message);
          // 尝试获取现有用户
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === student.email);
          if (existingUser) {
            createdStudents.push({
              id: existingUser.id,
              username: student.username,
              email: student.email
            });
          }
          continue;
        }
        
        console.log(`✅ 学生创建成功: ${student.username}`);
        
        // 在users表中创建记录
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            username: student.username,
            password_hash: '$2a$10$tempPasswordHash', // 临时哈希
            role: 1, // 学生角色
            class_id: null
          })
          .select()
          .single();
        
        if (userError) {
          console.log(`❌ 用户记录创建失败: ${userError.message}`);
          continue;
        }
        
        createdStudents.push({
          id: authData.user.id,
          username: student.username,
          email: student.email
        });
        
      } catch (error) {
        console.log(`❌ 创建学生失败: ${error.message}`);
      }
    }
    
    console.log(`✅ 成功处理 ${createdStudents.length} 个学生账号`);
    
    // 2. 创建已通过审核的成果
    console.log('\n2️⃣ 创建测试成果...');
    const achievements = [
      {
        title: '机器学习算法优化研究',
        description: '本研究针对传统机器学习算法在大数据处理中的性能瓶颈，提出了一种基于分布式计算的优化方案。通过实验验证，该方案在准确率基本保持不变的情况下，将处理速度提升了40%以上。',
        type_id: 1, // 论文
        status: 2, // 已通过
        score: 95,
        publisher_id: createdStudents[0]?.id,
        instructor_id: null
      },
      {
        title: '智能家居控制系统',
        description: '设计并实现了一套基于IoT技术的智能家居控制系统，包括环境监测、安防报警、远程控制等功能。系统采用模块化设计，具有良好的扩展性和用户体验。',
        type_id: 2, // 项目
        status: 2, // 已通过
        score: 88,
        publisher_id: createdStudents[1]?.id,
        instructor_id: null
      },
      {
        title: '响应式Web应用设计',
        description: '采用现代前端框架开发的响应式Web应用，实现了多设备适配和优秀的用户体验。包含用户管理、数据可视化、实时通信等核心功能模块。',
        type_id: 3, // 设计
        status: 2, // 已通过
        score: 92,
        publisher_id: createdStudents[2]?.id,
        instructor_id: null
      },
      {
        title: '数据可视化分析平台',
        description: '开发了一个集数据采集、处理、可视化分析于一体的综合性平台。支持多种数据源接入，提供丰富的图表类型和交互式分析功能。',
        type_id: 2, // 项目
        status: 2, // 已通过
        score: 85,
        publisher_id: createdStudents[0]?.id,
        instructor_id: null
      },
      {
        title: '移动学习应用开发',
        description: '针对移动学习场景设计的应用程序，整合了视频课程、在线测试、学习进度跟踪等功能。采用跨平台开发技术，确保良好的兼容性。',
        type_id: 2, // 项目
        status: 2, // 已通过
        score: 90,
        publisher_id: createdStudents[1]?.id,
        instructor_id: null
      }
    ];
    
    for (const achievement of achievements) {
      if (!achievement.publisher_id) {
        console.log(`⚠️ 跳过成果，缺少发布者: ${achievement.title}`);
        continue;
      }
      
      try {
        const { data: achievementData, error: achievementError } = await supabase
          .from('achievements')
          .insert(achievement)
          .select()
          .single();
        
        if (achievementError) {
          console.log(`❌ 成果创建失败: ${achievementError.message}`);
          continue;
        }
        
        console.log(`✅ 成果创建成功: ${achievement.title}`);
        
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
        console.log(`❌ 创建成果异常: ${error.message}`);
      }
    }
    
    console.log('\n3️⃣ 验证创建结果...');
    const { data: finalAchievements, error: finalError } = await supabase
      .from('achievements')
      .select('id, title, score, status, publisher_id')
      .eq('status', 2) // 只查询已通过的
      .order('created_at', { ascending: false });
    
    if (finalError) {
      console.log('❌ 验证失败:', finalError.message);
    } else {
      console.log(`✅ 验证成功，当前成果库有 ${finalAchievements.length} 个成果:`);
      finalAchievements.forEach((achievement, index) => {
        console.log(`  ${index + 1}. ${achievement.title} - ${achievement.score}分 - 状态:${achievement.status}`);
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
}

createTestLibraryData().catch(console.error);