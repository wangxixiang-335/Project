-- 数据库清理脚本 - 删除多余表
-- 生成时间: 2025-11-18
-- 目的: 保留标准表结构，删除多余的表

-- ⚠️ 重要提醒：
-- 1. 执行前请确保已备份重要数据
-- 2. 确认这些表中的数据不再需要
-- 3. 建议在事务中执行以便回滚

-- 开始事务
BEGIN;

-- 1. 删除用户相关的多余表
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS backup_profiles CASCADE;

-- 2. 删除项目相关的多余表  
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS project_reviews CASCADE;
DROP TABLE IF EXISTS backup_projects CASCADE;

-- 3. 检查是否还有其他可能的冗余表（可选）
-- DROP TABLE IF EXISTS audit_records CASCADE;

-- 提交事务
COMMIT;

-- 验证删除结果
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;