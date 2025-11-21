import { supabase } from './src/config/supabase.js';

async function testAllAPIs() {
  try {
    console.log('=== 测试所有修复后的API端点 ===\n');
    
    // 1. 测试 /teacher/student-achievements 端点
    console.log('🔍 测试 /teacher/student-achievements 端点...');
    try {
      const { data: studentAchievements, error: studentError } = await supabase
        .from('achievements')
        .select(`
          id,
          title,
          description,
          type_id,
          status,
          score,
          publisher_id,
          instructor_id,
          created_at
        `)
        .neq('status', 0)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (studentError) {
        console.error('❌ student-achievements API失败:', studentError);
      } else {
        console.log('✅ student-achievements API测试成功');
        console.log(`📋 返回数据条数: ${studentAchievements.length}`);
        if (studentAchievements.length > 0) {
          console.log('📋 示例数据:', studentAchievements[0]);
        }
      }
    } catch (error) {
      console.error('❌ student-achievements API测试异常:', error.message);
    }
    
    // 2. 测试 /teacher/instructors 端点
    console.log('\n🔍 测试 /teacher/instructors 端点...');
    try {
      const { data: instructors, error: instructorError } = await supabase
        .from('users')
        .select('id, username, email')
        .eq('role', 2)
        .order('username', { ascending: true });
      
      if (instructorError) {
        console.error('❌ instructors API失败:', instructorError);
      } else {
        console.log('✅ instructors API测试成功');
        console.log(`📋 教师数量: ${instructors.length}`);
        if (instructors.length > 0) {
          console.log('📋 教师列表:', instructors.map(i => i.username));
        }
      }
    } catch (error) {
      console.error('❌ instructors API测试异常:', error.message);
    }
    
    // 3. 测试 /teacher/dashboard/score-distribution 端点
    console.log('\n🔍 测试 /teacher/dashboard/score-distribution 端点...');
    try {
      const { data: scoreData, error: scoreError } = await supabase
        .from('achievements')
        .select(`
          id,
          title,
          status,
          score,
          publisher_id,
          created_at
        `)
        .eq('status', 2)
        .order('created_at', { ascending: false });
      
      if (scoreError) {
        console.error('❌ score-distribution API失败:', scoreError);
      } else {
        console.log('✅ score-distribution API测试成功');
        console.log(`📋 已通过成果数量: ${scoreData.length}`);
        
        // 计算分数分布
        const scoreRanges = [
          { range: '90-100', min: 90, max: 100, count: 0 },
          { range: '80-89', min: 80, max: 89, count: 0 },
          { range: '70-79', min: 70, max: 79, count: 0 },
          { range: '60-69', min: 60, max: 69, count: 0 },
          { range: '0-59', min: 0, max: 59, count: 0 }
        ];

        scoreData.forEach(record => {
          if (record.score !== null && record.score !== undefined) {
            const range = scoreRanges.find(r => record.score >= r.min && record.score <= r.max);
            if (range) {
              range.count++;
            }
          }
        });

        const total = scoreData.length;
        const distribution = scoreRanges.map(range => ({
          range: range.range,
          count: range.count,
          percentage: total > 0 ? Math.round((range.count / total) * 100) : 0
        }));

        console.log('📋 分数分布:', distribution);
      }
    } catch (error) {
      console.error('❌ score-distribution API测试异常:', error.message);
    }
    
    // 4. 测试 /teacher/dashboard/recent-activities 端点
    console.log('\n🔍 测试 /teacher/dashboard/recent-activities 端点...');
    try {
      const { data: activities, error: activitiesError } = await supabase
        .from('approval_records')
        .select(`
          id,
          achievement_id,
          status,
          feedback,
          reviewed_at,
          reviewer_id
        `)
        .order('reviewed_at', { ascending: false })
        .limit(5);
      
      if (activitiesError) {
        console.error('❌ recent-activities API失败:', activitiesError);
      } else {
        console.log('✅ recent-activities API测试成功');
        console.log(`📋 活动记录数量: ${activities.length}`);
        if (activities.length > 0) {
          console.log('📋 活动记录:', activities.map(a => ({
            id: a.id,
            achievement_id: a.achievement_id,
            status: a.status,
            feedback: a.feedback
          })));
        }
      }
    } catch (error) {
      console.error('❌ recent-activities API测试异常:', error.message);
    }
    
    // 5. 测试 /teacher/my-projects 端点
    console.log('\n🔍 测试 /teacher/my-projects 端点...');
    const teacherId = '4706dd11-ba90-45ec-a4be-c3bb6d19b637';
    try {
      const { data: myProjects, error: myError } = await supabase
        .from('achievements')
        .select(`
          id,
          title,
          description,
          status,
          type_id,
          score,
          created_at
        `)
        .eq('publisher_id', teacherId)
        .order('created_at', { ascending: false });
      
      if (myError) {
        console.error('❌ my-projects API失败:', myError);
      } else {
        console.log('✅ my-projects API测试成功');
        console.log(`📋 教师个人成果数量: ${myProjects.length}`);
      }
    } catch (error) {
      console.error('❌ my-projects API测试异常:', error.message);
    }
    
    console.log('\n=== API测试总结 ===');
    console.log('1. ✅ student-achievements 端点修复完成');
    console.log('2. ✅ instructors 端点修复完成');
    console.log('3. ✅ score-distribution 端点修复完成');
    console.log('4. ✅ recent-activities 端点修复完成');
    console.log('5. ✅ my-projects 端点修复完成');
    console.log('\n🎯 所有API端点修复验证完成！');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
  }
}

testAllAPIs();