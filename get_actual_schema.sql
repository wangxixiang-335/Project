-- 获取实际表结构信息
-- 在Supabase SQL编辑器中运行此查询

-- 1. 检查 users 表结构
SELECT 
    'users 表结构' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. 检查 backup_profiles 表结构  
SELECT 
    'backup_profiles 表结构' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'backup_profiles'
ORDER BY ordinal_position;

-- 3. 检查 achievements 表结构
SELECT 
    'achievements 表结构' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'achievements'
ORDER BY ordinal_position;

-- 4. 检查 backup_projects 表结构
SELECT 
    'backup_projects 表结构' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'backup_projects'
ORDER BY ordinal_position;

-- 5. 生成修正的迁移SQL
SELECT 
    '修正的用户数据迁移' as migration_type,
    'INSERT INTO users (id, username, role, created_at) 
     SELECT id, username, role, created_at FROM backup_profiles;' as sql_statement;

SELECT 
    '修正的成果数据迁移' as migration_type,
    'INSERT INTO achievements (id, title, description, type_id, video_url, status, publisher_id, created_at)
     SELECT id, title, content_html, (SELECT id FROM achievement_types LIMIT 1), video_url, 
            CASE status WHEN ''pending'' THEN 1 WHEN ''approved'' THEN 2 WHEN ''rejected'' THEN 3 ELSE 0 END,
            user_id, created_at FROM backup_projects;' as sql_statement;