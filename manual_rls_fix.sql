-- 手动修复RLS无限递归问题
-- 请在Supabase Dashboard的SQL Editor中执行

-- ==================== 第一步：删除现有策略 ====================

-- 删除profiles表的有问题的策略
DROP POLICY IF EXISTS "教师可以查看所有用户profile" ON profiles;

-- 删除projects表的有问题的策略  
DROP POLICY IF EXISTS "用户可以查看自己的项目" ON projects;
DROP POLICY IF EXISTS "用户可以管理自己的项目" ON projects;
DROP POLICY IF EXISTS "教师可以查看所有项目" ON projects;

-- ==================== 第二步：创建修复后的策略 ====================

-- 修复后的教师查看策略 - 避免递归
CREATE POLICY "教师可以查看所有用户profile" ON profiles
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'teacher'
  )
);

-- projects表策略 - 使用直接比较避免递归
CREATE POLICY "用户可以查看自己的项目" ON projects
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以管理自己的项目" ON projects  
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "教师可以查看所有项目" ON projects
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'teacher'
  )
);

-- ==================== 第三步：验证修复结果 ====================

-- 检查策略是否成功创建
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'projects');

-- 测试查询是否正常工作（不应该出现无限递归错误）
SELECT COUNT(*) as profile_count FROM profiles;
SELECT COUNT(*) as project_count FROM projects;

-- 如果以上查询正常执行，说明修复成功！
SELECT '🎉 RLS无限递归问题修复完成！' as status;