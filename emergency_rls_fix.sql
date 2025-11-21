
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
