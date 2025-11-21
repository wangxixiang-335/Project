-- 备份现有数据的SQL脚本
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 备份 profiles 表
DROP TABLE IF EXISTS backup_profiles;
CREATE TABLE backup_profiles AS 
SELECT id, username, email, role, created_at, updated_at FROM profiles;

-- 2. 备份 projects 表
DROP TABLE IF EXISTS backup_projects;
CREATE TABLE backup_projects AS 
SELECT id, user_id, title, content_html, video_url, images_array, status, created_at, updated_at, category FROM projects;

-- 4. 显示备份结果
SELECT 'profiles 表备份完成' as status, COUNT(*) as record_count FROM backup_profiles;
SELECT 'projects 表备份完成' as status, COUNT(*) as record_count FROM backup_projects;
