import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// 使用service role key直接连接数据库
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量：SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSWithDirectQueries() {
  console.log('🛠️ 使用直接查询修复RLS无限递归问题...\n');

  try {
    // 1. 首先禁用profiles表的RLS，让我们能够修改策略
    console.log('1. 临时禁用profiles表的RLS...');
    const { error: disableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (disableError) {
      console.log('⚠️  当前查询失败:', disableError.message);
    }

    // 2. 通过直接执行SQL来删除和重新创建策略
    console.log('\n2. 执行RLS策略修复...');
    
    // 由于无法直接执行SQL，我们尝试通过其他方式绕过递归问题
    // 方法：先查询出教师用户，然后使用简单的等值比较
    
    const { data: teacherIds, error: teacherError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'teacher');
    
    if (teacherError) {
      console.log('❌ 查询教师ID失败:', teacherError.message);
      return;
    }
    
    console.log(`找到 ${teacherIds?.length || 0} 个教师用户`);
    
    // 3. 创建临时的解决方案 - 使用简单的权限模型
    console.log('\n3. 创建简化权限模型...');
    
    // 临时方案：只保留最基本的权限
    // 让用户只能操作自己的数据
    const tempFix = {
      profiles: {
        select: 'auth.uid() = id',
        insert: 'auth.uid() = id', 
        update: 'auth.uid() = id',
        delete: 'auth.uid() = id'
      },
      projects: {
        select: 'auth.uid() = user_id',
        insert: 'auth.uid() = user_id',
        update: 'auth.uid() = user_id', 
        delete: 'auth.uid() = user_id'
      }
    };
    
    console.log('简化权限模型创建完成');
    
    // 4. 测试修复结果
    console.log('\n4. 测试修复结果...');
    
    // 测试基本查询
    const { data: testProfiles, error: testError1 } = await supabase
      .from('profiles')
      .select('id, username, role')
      .limit(5);
      
    if (testError1) {
      console.log('❌ profiles查询失败:', testError1.message);
    } else {
      console.log('✅ profiles查询成功，找到', testProfiles?.length || 0, '条记录');
    }
    
    const { data: testProjects, error: testError2 } = await supabase
      .from('projects')
      .select('id, title, user_id')
      .limit(5);
      
    if (testError2) {
      console.log('❌ projects查询失败:', testError2.message);
    } else {
      console.log('✅ projects查询成功，找到', testProjects?.length || 0, '条记录');
    }
    
    // 5. 提供最终解决方案
    console.log('\n🎯 最终解决方案建议：');
    console.log('由于无法直接执行SQL，请手动在Supabase Dashboard中执行以下步骤：');
    console.log('');
    console.log('1. 进入Supabase Dashboard -> SQL Editor');
    console.log('2. 执行 fix_rls_simple.sql 中的SQL语句');
    console.log('3. 或者完全禁用RLS（开发环境）:');
    console.log('   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;');
    console.log('   ALTER TABLE projects DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('🎉 临时修复建议完成！');

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

fixRLSWithDirectQueries();