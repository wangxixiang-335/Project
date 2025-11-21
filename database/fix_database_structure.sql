-- 修复数据库表结构 - 匹配后端代码需求
-- ===========================================

-- 1. 先删除现有的表（如果存在）
DROP TABLE IF EXISTS project_reviews;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS profiles;

-- 2. 创建正确的profiles表
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建正确的projects表（包含后端需要的字段）
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_html TEXT,  -- 后端需要的字段：HTML内容
    video_url TEXT,     -- 后端需要的字段：视频链接
    images_array TEXT[], -- 后端需要的字段：图片数组
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建project_reviews表（如果需要）
CREATE TABLE project_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    feedback TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建索引
CREATE UNIQUE INDEX profiles_username_idx ON profiles(username);
CREATE UNIQUE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX profiles_role_idx ON profiles(role);

CREATE INDEX projects_user_id_idx ON projects(user_id);
CREATE INDEX projects_status_idx ON projects(status);
CREATE INDEX projects_created_at_idx ON projects(created_at);

CREATE INDEX project_reviews_project_id_idx ON project_reviews(project_id);
CREATE INDEX project_reviews_reviewer_id_idx ON project_reviews(reviewer_id);

-- 6. 启用RLS并创建策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;

-- profiles表策略
CREATE POLICY "用户可以查看自己的profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "教师可以查看所有用户profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

-- projects表策略
CREATE POLICY "用户可以查看自己的项目" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以管理自己的项目" ON projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "教师可以查看所有项目" ON projects
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

-- 7. 创建触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_reviews_updated_at
    BEFORE UPDATE ON project_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 验证表结构
SELECT '✅ profiles表创建成功' as result WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles');
SELECT '✅ projects表创建成功' as result WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects');
SELECT '✅ project_reviews表创建成功' as result WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_reviews');

-- 显示表结构
SELECT 
    table_name,
    string_agg(column_name || ' (' || data_type || ')', ', ') as columns
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'projects', 'project_reviews')
GROUP BY table_name;

SELECT '🎉 数据库表结构修复完成！' as message;