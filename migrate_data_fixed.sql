-- 修正的数据迁移脚本
-- 基于实际表结构差异

-- ===== 处理用户表迁移 =====

-- 由于新users表结构可能与backup_profiles不同，我们使用安全的迁移方式
-- 只迁移共有的字段，缺失字段使用默认值

-- 1. 迁移用户基础数据（只迁移共有字段）
INSERT INTO users (id, username, role, created_at, password_hash)
SELECT 
    id,
    username,
    CASE role 
        WHEN 'student' THEN 1
        WHEN 'teacher' THEN 2  
        WHEN 'admin' THEN 3
        ELSE 1
    END as role,
    created_at,
    '$2a$10$DefaultPasswordHash' as password_hash -- 默认密码哈希，实际应该使用Supabase Auth
FROM backup_profiles;

-- 验证用户迁移
SELECT '✅ 用户迁移完成 - 记录数:' as status, COUNT(*) as count FROM users;

-- ===== 处理成果表迁移 =====

-- 2. 迁移成果数据（从 backup_projects 到 achievements）
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
    id,
    title,
    content_html,
    (SELECT id FROM achievement_types WHERE name = '其他成果' LIMIT 1), -- 默认类型
    COALESCE(video_url, ''), -- 处理可能的NULL值
    CASE status
        WHEN 'pending' THEN 1    -- 待审批
        WHEN 'approved' THEN 2   -- 已发布
        WHEN 'rejected' THEN 3   -- 未通过
        ELSE 0                   -- 草稿
    END as status,
    user_id,
    created_at
FROM backup_projects;

-- 验证成果迁移
SELECT '✅ 成果迁移完成 - 记录数:' as status, COUNT(*) as count FROM achievements;

-- ===== 处理附件数据 =====

-- 3. 为每个成果创建基础附件记录（简化处理）
INSERT INTO achievement_attachments (achievement_id, file_name, file_url, file_size)
SELECT 
    id,
    'project_content.html',
    'data:text/html,' || LEFT(COALESCE(content_html, ''), 500),
    LENGTH(COALESCE(content_html, ''))
FROM backup_projects 
WHERE content_html IS NOT NULL AND content_html != '';

-- 验证附件迁移
SELECT '✅ 附件迁移完成 - 记录数:' as status, COUNT(*) as count FROM achievement_attachments;

-- ===== 数据一致性验证 =====

SELECT 
    '数据迁移总结' as summary,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM achievements) as achievements_count,
    (SELECT COUNT(*) FROM achievement_attachments) as attachments_count;

-- 检查状态分布
SELECT 
    '成果状态分布' as analysis_type,
    CASE status
        WHEN 0 THEN '草稿'
        WHEN 1 THEN '待审批'
        WHEN 2 THEN '已发布'
        WHEN 3 THEN '未通过'
    END as status_name,
    COUNT(*) as count
FROM achievements
GROUP BY status
ORDER BY status;

-- 对比迁移前后数据量
SELECT 
    '数据一致性检查' as check_type,
    (SELECT COUNT(*) FROM backup_profiles) as original_users,
    (SELECT COUNT(*) FROM users) as new_users,
    (SELECT COUNT(*) FROM backup_projects) as original_projects,
    (SELECT COUNT(*) FROM achievements) as new_achievements;