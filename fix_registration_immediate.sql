-- 立即修复注册问题的 SQL 脚本
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- ==================== 第一步：检查当前策略状态 ====================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- ==================== 第二步：临时禁用 profiles 表的 RLS ====================
-- 这会让注册功能立即工作
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ==================== 第三步：清理所有现有策略 ====================
DROP POLICY IF EXISTS "用户查看自己的profile" ON profiles;
DROP POLICY IF EXISTS "用户更新自己的profile" ON profiles;
DROP POLICY IF EXISTS "教师可以查看所有用户profile" ON profiles;
DROP POLICY IF EXISTS "用户注册创建profile" ON profiles;

-- ==================== 第四步：重新创建安全的策略 ====================
-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 策略1: 任何人都可以创建 profile（用于注册）
CREATE POLICY "任何人创建profile" ON profiles
    FOR INSERT WITH CHECK (true);

-- 策略2: 用户可以查看自己的profile信息
CREATE POLICY "用户查看自己的profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 策略3: 用户可以更新自己的profile信息
CREATE POLICY "用户更新自己的profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 策略4: 教师可以查看所有用户的profile（修复后的版本）
CREATE POLICY "教师可以查看所有用户profile" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- ==================== 第五步：验证修复 ====================
-- 检查策略是否成功创建
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 检查 RLS 状态
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 测试插入功能
INSERT INTO profiles (id, username, email, role) 
VALUES ('test-uuid-123', '测试用户', 'test@example.com', 'student')
ON CONFLICT (id) DO NOTHING;

-- 清理测试数据
DELETE FROM profiles WHERE id = 'test-uuid-123';

-- 显示当前 profiles 表中的记录数量
SELECT COUNT(*) as total_profiles FROM profiles;