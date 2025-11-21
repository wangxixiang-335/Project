-- 删除所有用户数据的SQL脚本
-- 按照外键依赖关系顺序删除相关数据

-- 1. 删除审核记录表中的数据（依赖projects和profiles）
DELETE FROM audit_records;

-- 2. 删除浏览记录表中的数据（依赖projects和profiles）
DELETE FROM view_records;

-- 3. 删除项目表中的数据（依赖profiles）
DELETE FROM projects;

-- 4. 删除用户扩展表中的数据
DELETE FROM profiles;

-- 5. 删除认证用户（如果需要的话，需要Supabase管理员权限）
-- 注意：这行默认注释掉，如果需要删除认证用户请取消注释
-- DELETE FROM auth.users WHERE email NOT LIKE '%@admin.com'; -- 保留管理员账号

-- 验证删除结果
SELECT 'profiles表记录数: ' || COUNT(*) as result FROM profiles
UNION ALL
SELECT 'projects表记录数: ' || COUNT(*) FROM projects
UNION ALL
SELECT 'audit_records表记录数: ' || COUNT(*) FROM audit_records
UNION ALL
SELECT 'view_records表记录数: ' || COUNT(*) FROM view_records;