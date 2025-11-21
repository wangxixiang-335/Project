-- 核心教育成果系统表结构
-- 基于PDF设计文档的简化版本，专注于主要功能

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户表 (与 Supabase Auth 集成)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role SMALLINT NOT NULL DEFAULT 1 CHECK (role IN (1, 2, 3)), -- 1学生/2教师/3管理员
    class_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 年级表
CREATE TABLE IF NOT EXISTS grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(32) NOT NULL
);

-- 3. 班级表
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    grade_id UUID NOT NULL,
    instructor_id UUID,
    CONSTRAINT fk_classes_grade FOREIGN KEY (grade_id) REFERENCES grades(id),
    CONSTRAINT fk_classes_instructor FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- 4. 成果类型表
CREATE TABLE IF NOT EXISTS achievement_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(32) NOT NULL
);

-- 5. 成果表 (主表)
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    type_id UUID NOT NULL,
    cover_url VARCHAR(255),
    video_url VARCHAR(255),
    status SMALLINT NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2, 3)), -- 0草稿/1待审批/2已发布/3未通过
    score DECIMAL(5,2),
    publisher_id UUID NOT NULL,
    instructor_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_achievements_type FOREIGN KEY (type_id) REFERENCES achievement_types(id),
    CONSTRAINT fk_achievements_publisher FOREIGN KEY (publisher_id) REFERENCES users(id),
    CONSTRAINT fk_achievements_instructor FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- 6. 成果附件表
CREATE TABLE IF NOT EXISTS achievement_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    achievement_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    CONSTRAINT fk_attachments_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- 7. 审批记录表
CREATE TABLE IF NOT EXISTS approval_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    achievement_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    status SMALLINT NOT NULL CHECK (status IN (0, 1)), -- 1通过/0驳回
    feedback VARCHAR(500),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_approval_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    CONSTRAINT fk_approval_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- 插入默认数据
INSERT INTO achievement_types (name) VALUES
    ('数学项目'),
    ('物理实验'),
    ('化学研究'),
    ('生物观察'),
    ('计算机编程'),
    ('工程设计'),
    ('文学创作'),
    ('艺术作品'),
    ('其他成果')
ON CONFLICT DO NOTHING;

INSERT INTO grades (name) VALUES
    ('一年级'),
    ('二年级'),
    ('三年级'),
    ('四年级'),
    ('五年级'),
    ('六年级')
ON CONFLICT DO NOTHING;

-- 创建基本索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_achievements_publisher_id ON achievements(publisher_id);
CREATE INDEX IF NOT EXISTS idx_achievements_status ON achievements(status);
CREATE INDEX IF NOT EXISTS idx_approval_records_achievement_id ON approval_records(achievement_id);

-- 创建与现有项目兼容的视图
CREATE OR REPLACE VIEW projects_view AS
SELECT 
    a.id,
    a.publisher_id as user_id,
    a.title,
    a.description as content_html,
    COALESCE(array_agg(aa.file_url), '{}') as images_array,
    a.video_url,
    a.type_id::text as category,
    CASE a.status 
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'pending' 
        WHEN 2 THEN 'approved'
        WHEN 3 THEN 'rejected'
    END as status,
    ar.feedback as reject_reason,
    ar.reviewer_id as auditor_id,
    a.created_at,
    ar.reviewed_at as audited_at
FROM achievements a
LEFT JOIN achievement_attachments aa ON a.id = aa.achievement_id
LEFT JOIN approval_records ar ON a.id = ar.achievement_id
GROUP BY a.id, a.publisher_id, a.title, a.description, a.video_url, a.type_id, a.status, ar.feedback, ar.reviewer_id, a.created_at, ar.reviewed_at;