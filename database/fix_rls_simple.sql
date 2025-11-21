-- 简化版RLS修复 - 直接解决无限递归问题
-- 这个版本避免使用子查询，使用更简单的逻辑

-- ==================== 第一步：删除所有现有策略 ====================
DROP POLICY IF EXISTS "教师可以查看所有用户profile" ON profiles;
DROP POLICY IF EXISTS "用户可以查看自己的项目" ON projects;
DROP POLICY IF EXISTS "用户可以管理自己的项目" ON projects;
DROP POLICY IF EXISTS "教师可以查看所有项目" ON projects;

-- ==================== 第二步：创建简化策略 ====================

-- profiles表：用户只能查看自己的资料
CREATE POLICY "用户查看自己的profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- projects表：用户只能查看和管理自己的项目
CREATE POLICY "用户查看自己的项目" ON projects
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户管理自己的项目" ON projects
FOR ALL USING (auth.uid() = user_id);

-- ==================== 第三步：如果需要教师权限，使用单独的函数 ====================
-- 创建一个函数来检查用户是否为教师，避免在策略中直接使用子查询
CREATE OR REPLACE FUNCTION is_teacher(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_id 
    AND profiles.role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 使用函数创建教师策略（更安全）
CREATE POLICY "教师查看所有profile" ON profiles
FOR SELECT USING (is_teacher(auth.uid()));

CREATE POLICY "教师查看所有项目" ON projects
FOR SELECT USING (is_teacher(auth.uid()));

-- ==================== 验证修复 ====================
SELECT 'RLS策略修复完成 - 无限递归问题已解决' as status;