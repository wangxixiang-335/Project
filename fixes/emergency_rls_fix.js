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

async function disableRLSTemporarily() {
  console.log('🔧 临时禁用RLS来解决无限递归问题...\n');

  try {
    // 创建一个可以执行原始SQL的函数
    console.log('1. 创建执行SQL的辅助函数...');
    
    // 由于无法直接创建函数，我们提供一个完整的SQL脚本
    const completeSQL = `
-- 紧急修复：临时禁用RLS来解决无限递归问题
-- 请在Supabase Dashboard的SQL Editor中执行以下语句：

-- 1. 禁用profiles表的RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. 禁用projects表的RLS  
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- 3. 验证RLS已禁用
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'projects');

-- 4. 测试查询（应该不再出现无限递归错误）
SELECT COUNT(*) as profile_count FROM profiles;
SELECT COUNT(*) as project_count FROM projects;

SELECT '🎉 RLS已临时禁用，无限递归问题解决！' as status;
`;

    console.log('2. 请手动执行以下SQL：');
    console.log('========================================');
    console.log(completeSQL);
    console.log('========================================');
    
    // 3. 测试当前状态
    console.log('\n3. 测试当前数据库状态...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('❌ profiles表查询失败:', profileError.message);
      if (profileError.message.includes('infinite recursion')) {
        console.log('🔴 确认存在无限递归问题！');
      }
    } else {
      console.log('✅ profiles表查询成功');
    }
    
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectError) {
      console.log('❌ projects表查询失败:', projectError.message);
      if (projectError.message.includes('infinite recursion')) {
        console.log('🔴 确认存在无限递归问题！');
      }
    } else {
      console.log('✅ projects表查询成功');
    }
    
    console.log('\n🎯 解决方案总结：');
    console.log('1. 复制上面的SQL代码');
    console.log('2. 打开Supabase Dashboard -> SQL Editor');
    console.log('3. 粘贴并执行SQL');
    console.log('4. 重新测试项目提交功能');
    console.log('');
    console.log('⚠️  注意：这只是临时解决方案，生产环境需要重新设计RLS策略');
    
    // 保存SQL到文件
    const fs = await import('fs');
    fs.writeFileSync('./emergency_rls_fix.sql', completeSQL);
    console.log('\n💾 SQL脚本已保存到 emergency_rls_fix.sql');

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

disableRLSTemporarily();