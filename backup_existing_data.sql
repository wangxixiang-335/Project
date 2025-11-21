-- 备份现有数据的SQL脚本
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 备份 profiles 表
DROP TABLE IF EXISTS backup_profiles;
CREATE TABLE backup_profiles AS 
SELECT id, username, email, role, created_at, updated_at, avatar_url, full_name, phone, bio, is_active 
FROM profiles;

-- 显示备份结果
SELECT 'profiles 表备份完成' as status, COUNT(*) as record_count FROM backup_profiles;

-- 2. 备份 projects 表
DROP TABLE IF EXISTS backup_projects;
CREATE TABLE backup_projects AS 
SELECT id, user_id, title, content_html, images_array, video_url, category, status, reject_reason, auditor_id, created_at, updated_at, audited_at 
FROM projects;

-- 显示备份结果
SELECT 'projects 表备份完成' as status, COUNT(*) as record_count FROM backup_projects;

-- 3. 检查 audit_records 表是否存在
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'audit_records'
    ) THEN
        DROP TABLE IF EXISTS backup_audit_records;
        CREATE TABLE backup_audit_records AS 
        SELECT * FROM audit_records;
        
        RAISE NOTICE 'audit_records 表备份完成，记录数: %', (SELECT COUNT(*) FROM backup_audit_records);
    ELSE
        RAISE NOTICE 'audit_records 表不存在，跳过备份';
    END IF;
END $$;

-- 4. 显示所有备份表的状态
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name = 'backup_' || table_name) as backup_exists,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'backup_' || table_name)
        THEN (SELECT COUNT(*)::text FROM backup_profiles WHERE table_name = 'profiles'
              UNION ALL
              SELECT COUNT(*)::text FROM backup_projects WHERE table_name = 'projects'
              UNION ALL
              SELECT COUNT(*)::text FROM backup_audit_records WHERE table_name = 'audit_records')
        ELSE '0'
    END as backup_count
FROM (VALUES ('profiles'), ('projects'), ('audit_records')) AS t(table_name);

-- 5. 验证备份数据
SELECT '备份验证结果:' as info;
SELECT 'backup_profiles 记录数:' as info, COUNT(*) as count FROM backup_profiles;
SELECT 'backup_projects 记录数:' as info, COUNT(*) as count FROM backup_projects;
SELECT 'backup_audit_records 记录数:' as info, COUNT(*) as count FROM backup_audit_records WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_audit_records');