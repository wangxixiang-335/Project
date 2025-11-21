import { supabase } from './src/config/supabase.js';

async function debugSimpleAPI() {
  try {
    console.log('=== 简化API调试 ===\n');
    
    // 1. 检查achievements表结构
    console.log('🔍 检查achievements表的基本数据...');
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*');
    
    if (achievementsError) {
      console.error('❌ achievements表查询失败:', achievementsError);
    } else {
      console.log('✅ achievements表数据:');
      achievements.forEach(achievement => {
        console.log(`  ID: ${achievement.id}`);
        console.log(`  标题: ${achievement.title}`);
        console.log(`  发布者ID: ${achievement.publisher_id}`);
        console.log(`  状态: ${achievement.status} (${achievement.status === 1 ? '待审核' : achievement.status === 2 ? '已通过' : achievement.status === 3 ? '已打回' : '草稿'})`);
        console.log(`  创建时间: ${achievement.created_at}`);
        console.log('---');
      });
    }
    
    // 2. 简化的教师个人成果查询
    console.log('\n🔍 简化的教师个人成果查询...');
    const teacherId = '4706dd11-ba90-45ec-a4be-c3bb6d19b637';
    
    const { data: teacherProjects, error: teacherError } = await supabase
      .from('achievements')
      .select('*')
      .eq('publisher_id', teacherId);
    
    if (teacherError) {
      console.error('❌ 教师个人成果查询失败:', teacherError);
    } else {
      console.log(`✅ 教师个人成果数: ${teacherProjects.length}`);
      if (teacherProjects.length > 0) {
        teacherProjects.forEach(project => {
          console.log(`  - ${project.title} (状态: ${project.status})`);
        });
      }
    }
    
    // 3. 简化的所有学生成果查询
    console.log('\n🔍 简化的所有学生成果查询...');
    const { data: studentProjects, error: studentError } = await supabase
      .from('achievements')
      .select('id, title, status, publisher_id, created_at')
      .neq('status', 0);
    
    if (studentError) {
      console.error('❌ 学生成果查询失败:', studentError);
    } else {
      console.log(`✅ 学生成果数: ${studentProjects.length}`);
      studentProjects.forEach(project => {
        console.log(`  - ${project.title} (状态: ${project.status}, 发布者: ${project.publisher_id})`);
      });
    }
    
    // 4. 检查用户关联
    console.log('\n🔍 检查用户关联...');
    if (studentProjects && studentProjects.length > 0) {
      const publisherIds = [...new Set(studentProjects.map(p => p.publisher_id))];
      
      for (const publisherId of publisherIds) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, username, role')
          .eq('id', publisherId)
          .single();
        
        if (userError) {
          console.error(`❌ 查询用户 ${publisherId} 失败:`, userError);
        } else {
          console.log(`✅ 用户 ${publisherId}: ${user.username} (${user.role === 1 ? '学生' : user.role === 2 ? '教师' : '管理员'})`);
        }
      }
    }
    
    // 5. 测试API响应格式
    console.log('\n🔍 测试API响应格式...');
    
    // 模拟 TeacherManage 组件期望的格式
    const formattedProjects = studentProjects ? studentProjects.map(project => ({
      id: project.id,
      title: project.title,
      status: project.status,
      status_text: project.status === 1 ? '待审核' : project.status === 2 ? '已通过' : project.status === 3 ? '已打回' : '草稿',
      cover_image: null,
      created_at: project.created_at,
      score: null,
      project_type: '项目'
    })) : [];
    
    console.log('✅ 格式化后的项目数据:', formattedProjects);
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugSimpleAPI();