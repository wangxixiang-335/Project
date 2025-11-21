import { supabase } from './src/config/supabase.js';

console.log('🔍 测试API调用...');

// 模拟用户身份
const mockUser = { id: '12345-abcde-test-user' };

async function testNotificationsAPI() {
  console.log('\n📨 测试通知API...');
  
  try {
    // 测试查询 - 修复score字段问题
    const { data: notifications, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        status,
        feedback,
        view_count,
        created_at,
        updated_at,
        reject_reason,
        cover_image
      `)
      .eq('student_id', mockUser.id)
      .or('status.eq.2,status.eq.3') // 已发布/未通过
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ 通知查询失败:', error);
      console.log('错误详情:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
    } else {
      console.log('✅ 通知查询成功');
      console.log(`找到 ${notifications?.length || 0} 条通知`);
    }
    
  } catch (error) {
    console.error('❌ 通知API测试失败:', error);
  }
}

async function testProjectManagementAPI() {
  console.log('\n📋 测试项目管理API...');
  
  try {
    // 测试项目查询 - 修复字段问题，只使用存在的字段
    let query = supabase
      .from('projects')
      .select(`
        id,
        title,
        content_html,
        video_url,
        status,
        created_at,
        updated_at
      `)
      .eq('user_id', mockUser.id) // 实际字段是user_id
      .order('created_at', { ascending: false });

    // 测试状态筛选
    const statusMap = {
      'draft': 0,
      'pending': 1,
      'published': 2,
      'rejected': 3
    };
    
    query = query.eq('status', statusMap['pending']);

    const { data: projects, error } = await query;

    if (error) {
      console.error('❌ 项目查询失败:', error);
      console.log('错误详情:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
    } else {
      console.log('✅ 项目查询成功');
      console.log(`找到 ${projects?.length || 0} 个项目`);
    }
    
  } catch (error) {
    console.error('❌ 项目管理API测试失败:', error);
  }
}

async function testDatabaseStructure() {
  console.log('\n🗄️ 测试数据库结构...');
  
  try {
    // 测试projects表是否存在
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        console.error('❌ projects表不存在');
      } else if (error.code === 'PGRST204') {
        console.error('❌ projects表无权限访问');
      } else {
        console.error('❌ 数据库查询错误:', error);
      }
    } else {
      console.log('✅ projects表访问正常');
    }
    
  } catch (error) {
    console.error('❌ 数据库结构测试失败:', error);
  }
}

async function runTests() {
  await testDatabaseStructure();
  await testNotificationsAPI();
  await testProjectManagementAPI();
  
  console.log('\n🎉 测试完成！');
  process.exit(0);
}

runTests();