import { supabaseAdmin } from './src/config/supabase.js';

async function debugStudentAPI() {
  try {
    console.log('🔍 调试学生API问题...');
    
    // 1. 检查用户是否存在项目
    const studentId = '7afb6f48-92a6-49a7-b839-742198352c7e'; // 使用新创建的用户ID
    
    const { data: projects, error: projectError } = await supabaseAdmin
      .from('achievements')
      .select('*')
      .eq('publisher_id', studentId);
    
    if (projectError) {
      console.error('❌ 查询项目失败:', projectError);
    } else {
      console.log('该学生的项目数量:', projects?.length || 0);
      if (projects && projects.length > 0) {
        console.log('项目详情:', projects.map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          created_at: p.created_at
        })));
      }
    }
    
    // 2. 检查分页查询
    console.log('\n🔍 测试分页查询...');
    const page = 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    
    const { data: paginatedProjects, error: paginatedError } = await supabaseAdmin
      .from('achievements')
      .select('id, title, status, created_at')
      .eq('publisher_id', studentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    
    if (paginatedError) {
      console.error('❌ 分页查询失败:', paginatedError);
    } else {
      console.log('分页查询结果数量:', paginatedProjects?.length || 0);
    }
    
    // 3. 检查统计查询
    console.log('\n🔍 测试统计查询...');
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('achievements')
      .select('status')
      .eq('publisher_id', studentId);
    
    if (statsError) {
      console.error('❌ 统计查询失败:', statsError);
    } else {
      console.log('统计数据:', {
        total: stats?.length || 0,
        data: stats
      });
    }
    
    // 4. 为该学生创建一个测试项目
    console.log('\n📝 创建测试项目...');
    // 获取默认成果类型ID
    const { data: defaultType } = await supabaseAdmin
      .from('achievement_types')
      .select('id')
      .limit(1)
      .single();
    
    const defaultTypeId = defaultType?.id || '00000000-0000-0000-0000-000000000000';

    const { data: newProject, error: createError } = await supabaseAdmin
      .from('achievements')
      .insert({
        publisher_id: studentId,
        title: '测试项目 - ' + new Date().toLocaleString(),
        description: '<p>这是一个测试项目内容</p>',
        type_id: defaultTypeId,
        video_url: '',
        status: 0
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ 创建项目失败:', createError);
    } else {
      console.log('✅ 创建测试项目成功:', newProject.title);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

debugStudentAPI();