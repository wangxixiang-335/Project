import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 测试数据库连接...');
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  
  try {
    // 测试查询users表
    console.log('\n📋 查询users表...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, role')
      .limit(5);
    
    if (usersError) {
      console.error('❌ 查询users表失败:', usersError);
    } else {
      console.log('✅ users表数据:', users);
    }
    
    // 测试查询achievements表
    console.log('\n📋 查询achievements表...');
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        status,
        publisher_id,
        users:publisher_id (id, username, role)
      `)
      .limit(5);
    
    if (achievementsError) {
      console.error('❌ 查询achievements表失败:', achievementsError);
    } else {
      console.log('✅ achievements表数据:', achievements);
    }
    
    // 测试查询教师数据
    console.log('\n📋 查询教师数据...');
    const { data: teachers, error: teachersError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('role', 2); // 2表示教师
    
    if (teachersError) {
      console.error('❌ 查询教师数据失败:', teachersError);
    } else {
      console.log(`✅ 找到 ${teachers.length} 个教师:`, teachers);
    }
    
    // 测试查询成果类型
    console.log('\n📋 查询成果类型...');
    const { data: types, error: typesError } = await supabase
      .from('achievement_types')
      .select('id, name');
    
    if (typesError) {
      console.error('❌ 查询成果类型失败:', typesError);
    } else {
      console.log('✅ 成果类型:', types);
    }
    
    // 测试查询班级信息
    console.log('\n📋 查询班级信息...');
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        grades:grade_id (id, name)
      `)
      .limit(5);
    
    if (classesError) {
      console.error('❌ 查询班级信息失败:', classesError);
    } else {
      console.log('✅ 班级信息:', classes);
    }
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
  }
}

// 运行测试
testDatabase().then(() => {
  console.log('\n✅ 数据库测试完成');
}).catch(console.error);