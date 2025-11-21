-- 教育成果管理系统数据库表结构 v1.1
-- 基于PDF设计文档创建
-- 适用于 Supabase PostgreSQL

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表 (与 Supabase Auth 集成)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role SMALLINT NOT NULL DEFAULT 1 CHECK (role IN (1, 2, 3)), -- 1学生/2教师/3管理员
    class_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_users_class FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 年级表
CREATE TABLE IF NOT EXISTS grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(32) NOT NULL
);

-- 班级表
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    grade_id UUID NOT NULL,
    instructor_id UUID,
    CONSTRAINT fk_classes_grade FOREIGN KEY (grade_id) REFERENCES grades(id),
    CONSTRAINT fk_classes_instructor FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- 成果类型表
CREATE TABLE IF NOT EXISTS achievement_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(32) NOT NULL -- 如"游戏/创意"等
);

-- 成果表 (主表 - 对应项目的概念)
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT NOT NULL, -- 富文本描述（支持Markdown）
    type_id UUID NOT NULL,
    cover_url VARCHAR(255), -- 封面图URL（Supabase存储）
    video_url VARCHAR(255), -- 演示视频URL
    status SMALLINT NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2, 3)), -- 0草稿/1待审批/2已发布/3未通过
    score DECIMAL(5,2), -- 评分（0-100分）
    publisher_id UUID NOT NULL,
    instructor_id UUID, -- 指导教师ID
    parents_id UUID, -- 协作者
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_achievements_type FOREIGN KEY (type_id) REFERENCES achievement_types(id),
    CONSTRAINT fk_achievements_publisher FOREIGN KEY (publisher_id) REFERENCES users(id),
    CONSTRAINT fk_achievements_instructor FOREIGN KEY (instructor_id) REFERENCES users(id),
    CONSTRAINT fk_achievements_parents FOREIGN KEY (parents_id) REFERENCES users(id)
);

-- 成果附件表
CREATE TABLE IF NOT EXISTS achievement_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    achievement_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(255) NOT NULL, -- 文件存储路径（Supabase存储桶）
    file_size INT NOT NULL, -- 文件大小（字节）
    CONSTRAINT fk_attachments_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- 审批记录表
CREATE TABLE IF NOT EXISTS approval_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    achievement_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    status SMALLINT NOT NULL CHECK (status IN (0, 1)), -- 1通过/0驳回
    feedback VARCHAR(500), -- 驳回原因或评语
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_approval_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    CONSTRAINT fk_approval_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type SMALLINT NOT NULL CHECK (type IN (1, 2, 3)), -- 1审批请求/2通过/3驳回
    content VARCHAR(500) NOT NULL, -- 通知内容（自动生成）
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 新闻类型表
CREATE TABLE IF NOT EXISTS news_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(32) NOT NULL -- 如"学院动态"
);

-- 新闻表
CREATE TABLE IF NOT EXISTS news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL, -- 新闻内容（富文本）
    category_id UUID NOT NULL,
    is_top BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_news_category FOREIGN KEY (category_id) REFERENCES news_categories(id)
);

-- 轮播图表
CREATE TABLE IF NOT EXISTS banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL, -- 图片URL（Supabase存储）
    text_content VARCHAR(100), -- 文字内容（首页Banner文案）
    link_url VARCHAR(255), -- 跳转链接
    display_order SMALLINT NOT NULL CHECK (display_order BETWEEN 1 AND 99) -- 显示顺序（1-99）
);

-- 知识库表
CREATE TABLE IF NOT EXISTS knowledge_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT, -- 文件描述
    file_url VARCHAR(255) NOT NULL, -- 文件存储路径（Supabase存储桶）
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_knowledge_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id);

CREATE INDEX IF NOT EXISTS idx_classes_grade_id ON classes(grade_id);
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON classes(instructor_id);

CREATE INDEX IF NOT EXISTS idx_achievements_publisher_id ON achievements(publisher_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type_id ON achievements(type_id);
CREATE INDEX IF NOT EXISTS idx_achievements_status ON achievements(status);
CREATE INDEX IF NOT EXISTS idx_achievements_created_at ON achievements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_instructor_id ON achievements(instructor_id);

CREATE INDEX IF NOT EXISTS idx_achievement_attachments_achievement_id ON achievement_attachments(achievement_id);

CREATE INDEX IF NOT EXISTS idx_approval_records_achievement_id ON approval_records(achievement_id);
CREATE INDEX IF NOT EXISTS idx_approval_records_reviewer_id ON approval_records(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_approval_records_reviewed_at ON approval_records(reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_category_id ON news(category_id);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_top ON news(is_top);

CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);

CREATE INDEX IF NOT EXISTS idx_knowledge_files_uploaded_by ON knowledge_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_created_at ON knowledge_files(created_at DESC);

-- 创建全文搜索索引 (用于成果标题和描述搜索)
CREATE INDEX IF NOT EXISTS idx_achievements_fts ON achievements USING gin(to_tsvector('chinese', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_news_fts ON news USING gin(to_tsvector('chinese', title || ' ' || content));

-- 插入默认数据
INSERT INTO achievement_types (name) VALUES
    ('游戏'),
    ('创意'),
    ('办公'),
    ('工具'),
    ('教育'),
    ('娱乐'),
    ('其他')
ON CONFLICT DO NOTHING;

INSERT INTO news_categories (name) VALUES
    ('学院动态'),
    ('教学视角'),
    ('学生风采'),
    ('通知公告'),
    ('行业资讯')
ON CONFLICT DO NOTHING;

INSERT INTO grades (name) VALUES
    ('一年级'),
    ('二年级'),
    ('三年级'),
    ('四年级'),
    ('五年级'),
    ('六年级')
ON CONFLICT DO NOTHING;

-- 行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_files ENABLE ROW LEVEL SECURITY;

-- Users 表策略
CREATE POLICY "用户可以查看自己的信息" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "教师可以查看所有用户信息" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN (2, 3) -- 教师或管理员
        )
    );

-- Achievements 表策略
CREATE POLICY "用户可以查看自己的成果" ON achievements
    FOR SELECT USING (auth.uid() = publisher_id);

CREATE POLICY "教师可以查看所有成果" ON achievements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN (2, 3)
        )
    );

CREATE POLICY "用户可以创建自己的成果" ON achievements
    FOR INSERT WITH CHECK (auth.uid() = publisher_id);

CREATE POLICY "用户可以更新自己的成果" ON achievements
    FOR UPDATE USING (auth.uid() = publisher_id);

CREATE POLICY "教师可以审核成果" ON achievements
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN (2, 3)
        )
    );

-- Approval Records 表策略
CREATE POLICY "用户可以查看自己成果的审批记录" ON approval_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM achievements 
            WHERE achievements.id = approval_records.achievement_id 
            AND achievements.publisher_id = auth.uid()
        )
    );

CREATE POLICY "教师可以查看所有审批记录" ON approval_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN (2, 3)
        )
    );

CREATE POLICY "教师可以创建审批记录" ON approval_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN (2, 3)
        )
    );

-- Notifications 表策略
CREATE POLICY "用户可以查看自己的通知" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的通知" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- News 表策略 (公开读取)
CREATE POLICY "任何人都可以查看新闻" ON news
    FOR SELECT USING (true);

-- Banners 表策略 (公开读取)
CREATE POLICY "任何人都可以查看轮播图" ON banners
    FOR SELECT USING (true);

-- Knowledge Files 表策略 (公开读取)
CREATE POLICY "任何人都可以查看知识库文件" ON knowledge_files
    FOR SELECT USING (true);

-- 注释说明
COMMENT ON TABLE users IS '用户表';
COMMENT ON TABLE classes IS '班级表';
COMMENT ON TABLE grades IS '年级表';
COMMENT ON TABLE achievement_types IS '成果类型表';
COMMENT ON TABLE achievements IS '成果表（主表）';
COMMENT ON TABLE achievement_attachments IS '成果附件表';
COMMENT ON TABLE approval_records IS '审批记录表';
COMMENT ON TABLE notifications IS '通知表';
COMMENT ON TABLE news_categories IS '新闻类型表';
COMMENT ON TABLE news IS '新闻表';
COMMENT ON TABLE banners IS '轮播图表';
COMMENT ON TABLE knowledge_files IS '知识库文件表';

-- 与现有项目集成的视图 (可选)
-- 创建视图将 achievements 映射到 projects 结构
CREATE OR REPLACE VIEW projects_view AS
SELECT 
    a.id,
    a.publisher_id as user_id,
    a.title,
    a.description as content_html,
    array_agg(aa.file_url) as images_array,
    a.video_url,
    a.type_id as category,
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