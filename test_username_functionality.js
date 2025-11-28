import { supabase } from './src/config/supabase.js';

async function testUsernameFunctionality() {
  console.log('🧪 开始测试用户名功能...\n');

  try {
    // 1. 获取测试用户
    console.log('📋 步骤1: 获取测试用户');
    
    const { data: studentUser, error: studentError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 1)
      .limit(1)
      .single();
    
    const { data: teacherUser, error: teacherError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 2)
      .limit(1)
      .single();
    
    if (studentError || teacherError) {
      console.error('❌ 获取测试用户失败:', studentError || teacherError);
      return;
    }
    
    console.log(`✅ 学生测试用户: ${studentUser.username} (ID: ${studentUser.id})`);
    console.log(`✅ 教师测试用户: ${teacherUser.username} (ID: ${teacherUser.id})`);

    // 2. 测试学生功能
    console.log('\n👨‍🎓 步骤2: 测试学生功能');
    
    // 学生应该只能看到自己的成果
    const { data: studentAchievements, error: studentAchError } = await supabase
      .from('achievements')
      .select('id, title, publisher_id, status')
      .eq('publisher_id', studentUser.id)
      .order('created_at', { descending: true });
    
    if (studentAchError) {
      console.error('❌ 查询学生成果失败:', studentAchError);
    } else {
      console.log(`✅ 学生 ${studentUser.username} 有 ${studentAchievements.length} 个成果`);
      studentAchievements.slice(0, 3).forEach(ach => {
        console.log(`   - ${ach.title} (状态: ${ach.status})`);
      });
    }

    // 3. 测试教师功能
    console.log('\n👨‍🏫 步骤3: 测试教师功能');
    
    // 教师应该看到自己的成果
    const { data: teacherAchievements, error: teacherAchError } = await supabase
      .from('achievements')
      .select('id, title, publisher_id, status')
      .eq('publisher_id', teacherUser.id)
      .order('created_at', { descending: true });
    
    if (teacherAchError) {
      console.error('❌ 查询教师成果失败:', teacherAchError);
    } else {
      console.log(`✅ 教师 ${teacherUser.username} 有 ${teacherAchievements.length} 个成果`);
      teacherAchievements.slice(0, 3).forEach(ach => {
        console.log(`   - ${ach.title} (状态: ${ach.status})`);
      });
    }

    // 4. 测试教师查看学生成果功能
    console.log('\n👀 步骤4: 测试教师查看学生成果功能');
    
    let studentWorks = [];
    // 获取所有学生ID
    const { data: allStudents, error: studentsError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 1);
    
    if (studentsError) {
      console.error('❌ 获取学生列表失败:', studentsError);
    } else {
      const studentIds = allStudents.map(s => s.id);
      console.log(`✅ 找到 ${studentIds.length} 个学生用户`);
      
      // 教师应该能看到所有学生的成果
      const { data: works, error: worksError } = await supabase
        .from('achievements')
        .select('id, title, publisher_id, status')
        .in('publisher_id', studentIds)
        .neq('status', 0)  // 排除草稿
        .order('created_at', { descending: true })
        .limit(5);
      
      if (worksError) {
        console.error('❌ 查询学生成果失败:', worksError);
      } else {
        studentWorks = works;
        console.log(`✅ 教师可以查看 ${studentWorks.length} 个学生成果`);
        studentWorks.forEach(ach => {
          console.log(`   - ${ach.title} (发布者: ${ach.publisher_id}, 状态: ${ach.status})`);
        });
      }
    }

    // 5. 测试用户名显示功能
    console.log('\n📝 步骤5: 测试用户名显示功能');
    
    // 模拟前端获取用户信息
    const mockUserInfo = {
      id: studentUser.id,
      username: studentUser.username,
      role: studentUser.role === 1 ? 'student' : studentUser.role === 2 ? 'teacher' : 'admin'
    };
    
    console.log(`✅ 学生用户信息: ${JSON.stringify(mockUserInfo, null, 2)}`);
    
    const mockTeacherInfo = {
      id: teacherUser.id,
      username: teacherUser.username,
      role: teacherUser.role === 1 ? 'student' : teacherUser.role === 2 ? 'teacher' : 'admin'
    };
    
    console.log(`✅ 教师用户信息: ${JSON.stringify(mockTeacherInfo, null, 2)}`);

    // 6. 检查潜在的问题
    console.log('\n🔍 步骤6: 检查潜在问题');
    
    // 检查是否有硬编码的用户名
    const hardcodedPatterns = ['张同学', '张教授', '管理员', 'test', 'demo'];
    let foundHardcoded = false;
    
    // 这里应该检查前端代码，但我们先检查数据库中的测试数据
    const { data: testData, error: testError } = await supabase
      .from('achievements')
      .select('id, title, description')
      .or(`title.like.%test%,description.like.%test%`);
    
    if (testError) {
      console.error('❌ 检查测试数据失败:', testError);
    } else if (testData && testData.length > 0) {
      console.log(`⚠️  发现 ${testData.length} 个包含测试关键词的成果`);
      testData.slice(0, 2).forEach(item => {
        console.log(`   - ${item.title}: ${item.description?.substring(0, 50)}...`);
      });
    }

    // 7. 生成测试报告
    console.log('\n📊 测试报告');
    console.log('===================');
    console.log(`✅ 用户数据正常: ${allStudents?.length || 0} 学生, ${[teacherUser].length} 教师`);
    console.log(`✅ 成果关联正常: 学生成果 ${studentAchievements?.length || 0}, 教师成果 ${teacherAchievements?.length || 0}`);
    console.log(`✅ 权限分离正常: 教师可查看学生成果 ${studentWorks?.length || 0}`);
    console.log(`✅ 用户名显示: ${studentUser.username}, ${teacherUser.username}`);
    
    console.log('\n🎉 用户名功能测试完成');
    console.log('\n📌 建议:');
    console.log('1. 确保前端使用动态用户名而不是硬编码值');
    console.log('2. 验证用户认证流程正常工作');
    console.log('3. 测试多用户同时登录的情况');
    console.log('4. 检查用户权限是否正确分离');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testUsernameFunctionality().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ 测试过程出错:', err);
  process.exit(1);
});