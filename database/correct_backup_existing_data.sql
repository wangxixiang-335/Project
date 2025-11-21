-- 修正的备份脚本 - 基于实际表结构
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 备份 profiles 表（实际字段：id, username, email, role, created_at, updated_at）
DROP TABLE IF EXISTS backup_profiles;
CREATE TABLE backup_profiles AS 
SELECT id, username, email, role, created_at, updated_at FROM profiles;

-- 2. 备份 projects 表（实际字段：id, user_id, title, content_html, video_url, images_array, status, created_at, updated_at, category）
DROP TABLE IF EXISTS backup_projects;
CREATE TABLE backup_projects AS 
SELECT id, user_id, title, content_html, video_url, images_array, status, created_at, updated_at, category FROM projects;

-- 3. 检查 audit_records 表是否存在（根据检查结果，此表不存在）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'audit_records'
    ) THEN
        DROP TABLE IF EXISTS backup_audit_records;
        CREATE TABLE backup_audit_records AS SELECT * FROM audit_records;
        RAISE NOTICE 'audit_records 表备份完成';
    ELSE
        RAISE NOTICE 'audit_records 表不存在，跳过备份';
    END IF;
END $$;

-- 4. 验证备份结果
SELECT 'profiles 表备份完成' as status, COUNT(*) as record_count FROM backup_profiles;
SELECT 'projects 表备份完成' as status, COUNT(*) as record_count FROM backup_projects;

-- 5. 显示备份表摘要
SELECT 
    'profiles' as table_name,
    (SELECT COUNT(*) FROM backup_profiles) as backup_count,
    (SELECT COUNT(*) FROM profiles) as original_count;

SELECT 
    'projects' as table_name,
    (SELECT COUNT(*) FROM backup_projects) as backup_count,
    (SELECT COUNT(*) FROM projects) as original_count;