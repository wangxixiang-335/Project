-- 教育成果管理系统数据库表结构 - 修正创建顺序
-- 适用于 Supabase PostgreSQL

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== 第一阶段：基础表（无外部依赖） =====

-- 1. 年级表（无外部依赖）
CREATE TABLE IF NOT EXISTS grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(32) NOT NULL
);

-- 2. 成果类型表（无外部依赖）
CREATE TABLE IF NOT EXISTS achievement_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(32) NOT NULL
);

-- 3. 用户表（暂时不添加外键，后续再修改）
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role SMALLINT NOT NULL DEFAULT 1 CHECK (role IN (1, 2, 3)), -- 1学生/2教师/3管理员
    class_id UUID, -- 暂时不添加外键约束
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== 第二阶段：依赖基础表的表 =====

-- 4. 班级表（依赖 grades 和 users）
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    grade_id UUID NOT NULL,
    instructor_id UUID,
    CONSTRAINT fk_classes_grade FOREIGN KEY (grade_id) REFERENCES grades(id),
    CONSTRAINT fk_classes_instructor FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- ===== 第三阶段：依赖其他表的表 =====

-- 5. 成果表（依赖 users 和 achievement_types）
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

-- 6. 成果附件表（依赖 achievements）
CREATE TABLE IF NOT EXISTS achievement_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    achievement_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    CONSTRAINT fk_attachments_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- 7. 审批记录表（依赖 achievements 和 users）
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

-- ===== 第四阶段：其他功能表 =====

-- 8. 通知表（依赖 users）
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type SMALLINT NOT NULL CHECK (type IN (1, 2, 3)), -- 1审批请求/2通过/3驳回
    content VARCHAR(500) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. 新闻类型表（无外部依赖）
CREATE TABLE IF NOT EXISTS news_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(32) NOT NULL
);

-- 10. 新闻表（依赖 news_categories）
CREATE TABLE IF NOT EXISTS news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    category_id UUID NOT NULL,
    is_top BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_news_category FOREIGN KEY (category_id) REFERENCES news_categories(id)
);

-- 11. 轮播图表（无外部依赖）
CREATE TABLE IF NOT EXISTS banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    text_content VARCHAR(100),
    link_url VARCHAR(255),
    display_order SMALLINT NOT NULL CHECK (display_order BETWEEN 1 AND 99)
);

-- 12. 知识库表（依赖 users）
CREATE TABLE IF NOT EXISTS knowledge_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(255) NOT NULL,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_knowledge_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ===== 第五阶段：添加遗漏的外键和索引 =====

-- 为 users 表添加 class_id 外键（现在 classes 表已创建）
ALTER TABLE users 
ADD CONSTRAINT fk_users_class FOREIGN KEY (class_id) REFERENCES classes(id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_id ON classes(grade_id);
CREATE INDEX IF NOT EXISTS idx_achievements_publisher_id ON achievements(publisher_id);
CREATE INDEX IF NOT EXISTS idx_achievements_status ON achievements(status);

-- ===== 第六阶段：插入默认数据 =====

-- 插入默认成果类型
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

-- 插入默认年级
INSERT INTO grades (name) VALUES
    ('一年级'),
    ('二年级'),
    ('三年级'),
    ('四年级'),
    ('五年级'),
    ('六年级')
ON CONFLICT DO NOTHING;

-- 插入默认新闻分类
INSERT INTO news_categories (name) VALUES
    ('学院动态'),
    ('教学视角'),
    ('学生风采'),
    ('通知公告'),
    ('行业资讯')
ON CONFLICT DO NOTHING;

-- ===== 第七阶段：创建兼容视图 =====

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

-- ===== 第八阶段：验证创建结果 =====

-- 显示所有创建的表
SELECT '创建的表:' as info, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'classes', 'grades', 'achievements', 'achievement_types', 'achievement_attachments', 'approval_records')
ORDER BY table_name;

-- 显示表中的记录数
SELECT 'users 表记录数:' as info, COUNT(*) as count FROM users;
SELECT 'grades 表记录数:' as info, COUNT(*) as count FROM grades;
SELECT 'achievement_types 表记录数:' as info, COUNT(*) as count FROM achievement_types;