-- RLS 策略修复脚本
-- 请在 Supabase Dashboard 的 SQL Editor 中执行以下语句

-- ==================== 修复无限递归问题 ====================

-- 1. 删除有问题的策略
DROP POLICY IF EXISTS "教师可以查看所有用户profile" ON profiles;

-- 2. 重新创建修复后的策略（避免递归）
CREATE POLICY "教师可以查看所有用户profile" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- 3. 验证修复效果
-- 检查策略是否成功创建
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. 测试查询是否正常工作
SELECT COUNT(*) FROM profiles;

-- 如果以上查询正常执行，说明修复成功！