-- 简化数据迁移脚本
-- 核心功能数据迁移

-- ===== 第一步：迁移用户数据 =====
INSERT INTO users (id, username, email, role, created_at)
SELECT 
    id,
    username,
    email,
    CASE role 
        WHEN 'student' THEN 1
        WHEN 'teacher' THEN 2  
        WHEN 'admin' THEN 3
        ELSE 1
    END as role,
    created_at
FROM backup_profiles;

-- 验证用户迁移
SELECT '✅ 用户迁移完成 - 记录数:' as status, COUNT(*) as count FROM users;

-- ===== 第二步：迁移成果数据 =====
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
    video_url,
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

-- ===== 第三步：迁移附件数据（简化版） =====
-- 为每个项目创建一个默认附件记录（如果有图片）
INSERT INTO achievement_attachments (achievement_id, file_name, file_url, file_size)
SELECT 
    id,
    'project_content.html',
    'data:text/html,' || LEFT(content_html, 100), -- 简化的内容存储
    LENGTH(content_html)
FROM backup_projects 
WHERE content_html IS NOT NULL AND content_html != '';

-- 验证附件迁移
SELECT '✅ 附件迁移完成 - 记录数:' as status, COUNT(*) as count FROM achievement_attachments;

-- ===== 第四步：迁移总结 =====
SELECT 
    '迁移总结' as summary,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM achievements) as achievements_count,
    (SELECT COUNT(*) FROM achievement_attachments) as attachments_count;