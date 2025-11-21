import { supabase } from './src/config/supabase.js';

async function debugTeacherAPI() {
  try {
    console.log('=== 调试教师API数据获取 ===\n');
    
    // 1. 获取教师token（模拟登录）
    const teacherId = '4706dd11-ba90-45ec-a4be-c3bb6d19b637';
    console.log('🔍 教师ID:', teacherId);
    
    // 2. 测试教师个人成果API (/teacher/my-projects)
    console.log('\n🔍 测试教师个人成果API...');
    const { data: myProjects, error: myError } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        description,
        status,
        type_id,
        score,
        created_at,
        updated_at,
        achievement_types:type_id (id, name)
      `)
      .eq('publisher_id', teacherId)
      .order('created_at', { ascending: false });
    
    if (myError) {
      console.error('❌ 教师个人成果查询失败:', myError);
    } else {
      console.log('✅ 教师个人成果数:', myProjects.length);
      console.log('📋 教师个人成果:', myProjects);
    }
    
    // 3. 测试所有学生成果API (/teacher/student-achievements)
    console.log('\n🔍 测试所有学生成果API...');
    const { data: allAchievements, error: allError } = await supabase
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
        created_at,
        achievement_types:type_id (id, name),
        users:publisher_id (id, username, class_id),
        classes:users.class_id (id, name, grade_id),
        grades:classes.grade_id (id, name),
        instructors:instructor_id (id, username)
      `)
      .neq('status', 0) // 排除草稿状态
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ 所有学生成果查询失败:', allError);
    } else {
      console.log('✅ 所有学生成果数:', allAchievements.length);
      console.log('📋 所有学生成果:', allAchievements);
    }
    
    // 4. 测试成果库API (/teacher/library) - 只获取已通过的成果
    console.log('\n🔍 测试成果库API...');
    const { data: libraryProjects, error: libraryError } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        description,
        video_url,
        created_at,
        users:publisher_id (id, username)
      `)
      .eq('status', 2) // 2 表示已通过
      .order('created_at', { ascending: false });
    
    if (libraryError) {
      console.error('❌ 成果库查询失败:', libraryError);
    } else {
      console.log('✅ 成果库项目数:', libraryProjects.length);
      console.log('📋 成果库项目:', libraryProjects);
    }
    
    // 5. 检查附件数据
    console.log('\n🔍 检查附件数据...');
    const { data: attachments, error: attachmentError } = await supabase
      .from('achievement_attachments')
      .select('*');
    
    if (attachmentError) {
      console.error('❌ 附件查询失败:', attachmentError);
    } else {
      console.log('✅ 附件数量:', attachments.length);
      console.log('📋 附件数据:', attachments);
    }
    
    // 6. 检查用户数据
    console.log('\n🔍 检查用户数据...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, role, class_id');
    
    if (usersError) {
      console.error('❌ 用户查询失败:', usersError);
    } else {
      console.log('✅ 用户数量:', users.length);
      console.log('📋 用户列表:');
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.role === 1 ? '学生' : user.role === 2 ? '教师' : '管理员'})`);
      });
    }
    
    // 7. 统计信息
    console.log('\n🔍 计算统计信息...');
    const { count: total, error: totalError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true });
      
    const { count: pending, error: pendingError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 1);
      
    const { count: approved, error: approvedError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 2);
      
    const { count: rejected, error: rejectedError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 3);
    
    if (!totalError && !pendingError && !approvedError && !rejectedError) {
      console.log('✅ 统计信息:');
      console.log(`  - 总成果数: ${total}`);
      console.log(`  - 待审核: ${pending}`);
      console.log(`  - 已通过: ${approved}`);
      console.log(`  - 已打回: ${rejected}`);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
    console.error('详细错误:', error);
  }
}

debugTeacherAPI();