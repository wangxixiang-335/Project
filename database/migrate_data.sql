-- 数据迁移脚本
-- 将备份数据从旧表迁移到新的教育成果系统

-- ===== 第一步：迁移基础数据 =====

-- 1. 迁移用户数据（从 backup_profiles 到 users）
-- 注意：需要处理角色转换和添加默认密码
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
SELECT '用户迁移完成' as status, COUNT(*) as count FROM users;

-- ===== 第二步：迁移项目/成果数据 =====

-- 2. 迁移项目数据（从 backup_projects 到 achievements）
-- 注意：需要转换状态值和映射字段
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
SELECT '成果迁移完成' as status, COUNT(*) as count FROM achievements;

-- ===== 第三步：迁移附件数据 =====

-- 3. 迁移图片数据（从 backup_projects.images_array 到 achievement_attachments）
-- 处理数组类型的图片数据
DO $$
DECLARE
    proj_record RECORD;
    img_url TEXT;
    img_counter INTEGER := 0;
BEGIN
    FOR proj_record IN SELECT id, images_array FROM backup_projects WHERE images_array IS NOT NULL AND array_length(images_array, 1) > 0
    LOOP
        FOREACH img_url IN ARRAY proj_record.images_array
        LOOP
            INSERT INTO achievement_attachments (achievement_id, file_name, file_url, file_size)
            VALUES (
                proj_record.id,
                'image_' || img_counter || '.jpg',
                img_url,
                1024000 -- 假设1MB大小，实际应该获取真实文件大小
            );
            img_counter := img_counter + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '迁移了 % 个附件', img_counter;
END $$;

-- 验证附件迁移
SELECT '附件迁移完成' as status, COUNT(*) as count FROM achievement_attachments;

-- ===== 第四步：创建默认审批记录 =====

-- 4. 为已审核的项目创建审批记录
INSERT INTO approval_records (achievement_id, reviewer_id, status, feedback, reviewed_at)
SELECT 
    p.id as achievement_id,
    NULL as reviewer_id, -- 暂时没有审核人信息
    CASE p.status
        WHEN 'approved' THEN 1
        WHEN 'rejected' THEN 0
        ELSE 1
    END as status,
    NULL as feedback,
    p.updated_at as reviewed_at
FROM backup_projects p
WHERE p.status IN ('approved', 'rejected');

-- 验证审批记录
SELECT '审批记录创建完成' as status, COUNT(*) as count FROM approval_records;

-- ===== 第五步：数据一致性检查 =====

-- 5.1 检查数据完整性
SELECT 
    '用户表' as table_name,
    COUNT(*) as record_count
FROM users

UNION ALL

SELECT 
    '成果表' as table_name,
    COUNT(*) as record_count
FROM achievements

UNION ALL

SELECT 
    '附件表' as table_name,
    COUNT(*) as record_count
FROM achievement_attachments

UNION ALL

SELECT 
    '审批记录表' as table_name,
    COUNT(*) as record_count
FROM approval_records;

-- 5.2 检查数据一致性
SELECT 
    '备份用户 vs 新用户' as check_type,
    (SELECT COUNT(*) FROM backup_profiles) as backup_count,
    (SELECT COUNT(*) FROM users) as new_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM backup_profiles) = (SELECT COUNT(*) FROM users) 
        THEN '✅ 一致' 
        ELSE '❌ 不一致' 
    END as status;

SELECT 
    '备份项目 vs 新成果' as check_type,
    (SELECT COUNT(*) FROM backup_projects) as backup_count,
    (SELECT COUNT(*) FROM achievements) as new_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM backup_projects) = (SELECT COUNT(*) FROM achievements) 
        THEN '✅ 一致' 
        ELSE '❌ 不一致' 
    END as status;

-- 5.3 检查状态分布
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

-- ===== 第六步：创建默认班级和年级（可选） =====

-- 如果需要，可以创建默认的班级和年级数据
INSERT INTO grades (id, name) VALUES
    (gen_random_uuid(), '默认年级')
ON CONFLICT DO NOTHING;

-- 创建默认班级
INSERT INTO classes (id, name, grade_id, instructor_id)
SELECT 
    gen_random_uuid(),
    '默认班级',
    (SELECT id FROM grades LIMIT 1),
    (SELECT id FROM users WHERE role = 2 LIMIT 1) -- 找一个教师作为指导老师
ON CONFLICT DO NOTHING;

-- ===== 第七步：生成迁移报告 =====

SELECT 
    '数据迁移报告' as report_title,
    NOW() as migration_date;

SELECT 
    '迁移步骤' as step,
    '状态' as status,
    '记录数' as count
FROM (
    VALUES 
        ('用户数据迁移', '完成', (SELECT COUNT(*)::text FROM users)),
        ('成果数据迁移', '完成', (SELECT COUNT(*)::text FROM achievements)),
        ('附件数据迁移', '完成', (SELECT COUNT(*)::text FROM achievement_attachments)),
        ('审批记录创建', '完成', (SELECT COUNT(*)::text FROM approval_records))
) AS t(step, status, count);