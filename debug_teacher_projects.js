import { supabase } from './src/config/supabase.js';

async function debugTeacherProjects() {
  try {
    // 1. 获取教师ID
    const teacherEmail = 'teacher1763449748933@example.com';
    console.log('🔍 查询教师信息...');
    
    // 从auth.users获取用户ID
    const { data: authUser, error: authError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('username', 'teacher1763449748933')
      .single();
    
    if (authError) {
      console.error('❌ 获取教师信息失败:', authError);
      return;
    }
    
    console.log('✅ 教师信息:', authUser);
    const teacherId = authUser.id;
    
    // 2. 检查该教师的项目
    console.log('\n🔍 检查教师的项目...');
    const { data: projects, error: projectsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('publisher_id', teacherId);
    
    if (projectsError) {
      console.error('❌ 查询项目失败:', projectsError);
    } else {
      console.log(`✅ 找到 ${projects.length} 个项目`);
      if (projects.length > 0) {
        console.log('📋 项目详情:', projects);
      }
    }
    
    // 3. 检查所有项目（不限制教师）
    console.log('\n🔍 检查所有项目...');
    const { data: allProjects, error: allError } = await supabase
      .from('achievements')
      .select('id, title, publisher_id, status, created_at')
      .limit(10);
    
    if (allError) {
      console.error('❌ 查询所有项目失败:', allError);
    } else {
      console.log(`✅ 总项目数: ${allProjects.length}`);
      console.log('📋 前10个项目:', allProjects);
    }
    
    // 4. 检查数据库连接
    console.log('\n🔍 检查数据库连接...');
    const { data: dbCheck, error: dbError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true });
    
    if (dbError) {
      console.error('❌ 数据库连接失败:', dbError);
    } else {
      console.log('✅ 数据库连接正常');
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugTeacherProjects();