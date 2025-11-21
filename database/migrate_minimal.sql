-- 最小化数据迁移脚本
-- 只处理确定存在的字段

-- ===== 用户数据迁移 =====

-- 1. 只迁移确定存在的字段：id, username, role, created_at
-- 缺失字段使用默认值处理
INSERT INTO users (id, username, role, created_at, password_hash)
SELECT 
    bp.id,
    bp.username,
    CASE bp.role 
        WHEN 'student' THEN 1
        WHEN 'teacher' THEN 2  
        WHEN 'admin' THEN 3
        ELSE 1
    END as role,
    bp.created_at,
    '$2a$10$tempPasswordHash' as password_hash -- 临时密码，需要通过Supabase Auth重置
FROM backup_profiles bp;

-- 验证用户迁移
SELECT '用户迁移完成' as step, COUNT(*) as count FROM users;

-- ===== 成果数据迁移 =====

-- 2. 迁移成果基础数据
-- 使用确定存在的字段：id, title, content_html, video_url, status, user_id, created_at
INSERT INTO achievements (
    id,
    title,
    description,
    type_id,
    video_url,
    status,
    publisher_id,
    created_at
)
SELECT 
    bp.id,
    bp.title,
    bp.content_html,
    (SELECT id FROM achievement_types LIMIT 1), -- 关联到第一个可用的类型
    COALESCE(bp.video_url, ''),
    CASE bp.status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
        ELSE 0
    END,
    bp.user_id,
    bp.created_at
FROM backup_projects bp;

-- 验证成果迁移
SELECT '成果迁移完成' as step, COUNT(*) as count FROM achievements;

-- ===== 基础数据验证 =====

SELECT 
    '迁移结果汇总' as summary,
    '用户记录' as item, 
    (SELECT COUNT(*) FROM users) as count
UNION ALL
SELECT 
    '迁移结果汇总',
    '成果记录', 
    (SELECT COUNT(*) FROM achievements)
UNION ALL
SELECT 
    '迁移结果汇总',
    '原始用户', 
    (SELECT COUNT(*) FROM backup_profiles)
UNION ALL
SELECT 
    '迁移结果汇总',
    '原始成果', 
    (SELECT COUNT(*) FROM backup_projects);