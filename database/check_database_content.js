import { supabase } from './src/config/supabase.js';

async function checkDatabaseContent() {
  try {
    console.log('🔍 检查数据库内容...');
    
    // 1. 检查achievements表
    console.log('\n📊 检查achievements表...');
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .limit(10);
    
    if (achievementsError) {
      console.error('❌ achievements表查询失败:', achievementsError);
    } else {
      console.log(`✅ achievements表有 ${achievements.length} 条记录`);
      achievements.forEach((achievement, index) => {
        console.log(`📋 记录 ${index + 1}:`, {
          id: achievement.id,
          title: achievement.title,
          status: achievement.status,
          score: achievement.score,
          publisher_id: achievement.publisher_id,
          created_at: achievement.created_at
        });
      });
    }
    
    // 2. 检查users表
    console.log('\n👥 检查users表...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email, role, class_id')
      .limit(10);
    
    if (usersError) {
      console.error('❌ users表查询失败:', usersError);
    } else {
      console.log(`✅ users表有 ${users.length} 条记录`);
      users.forEach((user, index) => {
        console.log(`👤 用户 ${index + 1}:`, {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          class_id: user.class_id
        });
      });
    }
    
    // 3. 检查学生角色的用户
    console.log('\n🎓 检查学生用户...');
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 1); // 1 = 学生
    
    if (studentsError) {
      console.error('❌ 学生用户查询失败:', studentsError);
    } else {
      console.log(`✅ 找到 ${students.length} 个学生用户`);
      students.forEach((student, index) => {
        console.log(`🎓 学生 ${index + 1}:`, {
          id: student.id,
          username: student.username,
          email: student.email,
          class_id: student.class_id
        });
      });
    }
    
    // 4. 检查已发布的学生成果
    console.log('\n📚 检查已发布的学生成果...');
    if (students && students.length > 0) {
      const studentIds = students.map(s => s.id);
      const { data: studentAchievements, error: studentAchievementsError } = await supabase
        .from('achievements')
        .select('*')
        .in('publisher_id', studentIds)
        .neq('status', 0); // 排除草稿
      
      if (studentAchievementsError) {
        console.error('❌ 学生成果查询失败:', studentAchievementsError);
      } else {
        console.log(`✅ 找到 ${studentAchievements.length} 个学生成果`);
        studentAchievements.forEach((achievement, index) => {
          console.log(`📋 成果 ${index + 1}:`, {
            id: achievement.id,
            title: achievement.title,
            publisher_id: achievement.publisher_id,
            status: achievement.status,
            score: achievement.score,
            created_at: achievement.created_at
          });
        });
      }
    } else {
      console.log('⚠️ 没有找到学生用户，无法查询学生成果');
    }
    
    // 5. 检查表结构
    console.log('\n🏗️ 检查achievements表结构...');
    const { data: columns, error: columnsError } = await supabase
      .from('achievements')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.error('❌ 表结构查询失败:', columnsError);
    } else if (columns && columns.length > 0) {
      console.log('📋 achievements表字段:', Object.keys(columns[0]));
    }
    
    // 6. 创建一些测试数据（如果没有数据）
    if (!achievements || achievements.length === 0) {
      console.log('\n🔧 尝试创建测试数据...');
      
      // 先获取一个学生用户
      const { data: testStudent } = await supabase
        .from('users')
        .select('*')
        .eq('role', 1)
        .limit(1)
        .single();
      
      if (testStudent) {
        const testAchievements = [
          {
            title: '测试项目1',
            description: '这是一个测试项目',
            type_id: 1,
            status: 2, // 已通过
            score: 85,
            publisher_id: testStudent.id,
            instructor_id: null
          },
          {
            title: '测试项目2',
            description: '这是另一个测试项目',
            type_id: 2,
            status: 1, // 待审核
            score: null,
            publisher_id: testStudent.id,
            instructor_id: null
          }
        ];
        
        for (const achievement of testAchievements) {
          const { data: inserted, error: insertError } = await supabase
            .from('achievements')
            .insert(achievement)
            .select();
          
          if (insertError) {
            console.error('❌ 插入测试数据失败:', insertError);
          } else {
            console.log('✅ 插入测试数据成功:', inserted[0].title);
          }
        }
      } else {
        console.log('⚠️ 没有找到学生用户，无法创建测试数据');
      }
    }
    
  } catch (error) {
    console.error('🔥 检查数据库内容时发生错误:', error);
  }
}

checkDatabaseContent();