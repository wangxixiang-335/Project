-- ===========================================
-- 学生项目评审系统 - 完整数据库初始化SQL
-- ===========================================

-- 1. 创建profiles表（用户信息表）
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建projects表（项目信息表）
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    project_url TEXT,
    github_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建project_reviews表（项目评审表）
CREATE TABLE IF NOT EXISTS project_reviews (
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

-- ===========================================
-- 创建索引以提高查询性能
-- ===========================================

-- profiles表索引
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- projects表索引
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_category_idx ON projects(category);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at);

-- project_reviews表索引
CREATE INDEX IF NOT EXISTS project_reviews_project_id_idx ON project_reviews(project_id);
CREATE INDEX IF NOT EXISTS project_reviews_reviewer_id_idx ON project_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS project_reviews_status_idx ON project_reviews(status);
CREATE INDEX IF NOT EXISTS project_reviews_score_idx ON project_reviews(score);

-- ===========================================
-- 启用行级安全（RLS）
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 创建RLS策略
-- ===========================================

-- profiles表RLS策略
DROP POLICY IF EXISTS "用户可以查看自己的profile" ON profiles;
CREATE POLICY "用户可以查看自己的profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "用户可以更新自己的profile" ON profiles;
CREATE POLICY "用户可以更新自己的profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "教师可以查看所有用户profile" ON profiles;
CREATE POLICY "教师可以查看所有用户profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

DROP POLICY IF EXISTS "服务端可以插入profile" ON profiles;
CREATE POLICY "服务端可以插入profile" ON profiles
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "服务端可以更新所有profile" ON profiles;
CREATE POLICY "服务端可以更新所有profile" ON profiles
    FOR UPDATE USING (true);

-- projects表RLS策略
DROP POLICY IF EXISTS "用户可以查看自己的项目" ON projects;
CREATE POLICY "用户可以查看自己的项目" ON projects
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以管理自己的项目" ON projects;
CREATE POLICY "用户可以管理自己的项目" ON projects
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "教师可以查看所有项目" ON projects;
CREATE POLICY "教师可以查看所有项目" ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

DROP POLICY IF EXISTS "教师可以评审项目" ON projects;
CREATE POLICY "教师可以评审项目" ON projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- project_reviews表RLS策略
DROP POLICY IF EXISTS "用户可以查看自己的评审" ON project_reviews;
CREATE POLICY "用户可以查看自己的评审" ON project_reviews
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM projects WHERE id = project_id
        )
    );

DROP POLICY IF EXISTS "教师可以管理评审" ON project_reviews;
CREATE POLICY "教师可以管理评审" ON project_reviews
    FOR ALL USING (
        auth.uid() = reviewer_id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- ===========================================
-- 创建更新触发器
-- ===========================================

-- 为所有表创建updated_at触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- profiles表触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- projects表触发器
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- project_reviews表触发器
DROP TRIGGER IF EXISTS update_project_reviews_updated_at ON project_reviews;
CREATE TRIGGER update_project_reviews_updated_at
    BEFORE UPDATE ON project_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 创建示例数据（可选）
-- ===========================================

-- 插入示例教师用户（如果需要测试）
-- INSERT INTO profiles (id, username, email, role) VALUES 
-- ('11111111-1111-1111-1111-111111111111', 'teacher1', 'teacher1@example.com', 'teacher');

-- ===========================================
-- 验证表结构
-- ===========================================

SELECT '✅ profiles表创建成功' as result WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles');
SELECT '✅ projects表创建成功' as result WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects');
SELECT '✅ project_reviews表创建成功' as result WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_reviews');

-- ===========================================
-- 使用说明
-- ===========================================

COMMENT ON TABLE profiles IS '用户信息表，存储学生和教师的基本信息';
COMMENT ON TABLE projects IS '学生项目表，存储项目信息和状态';
COMMENT ON TABLE project_reviews IS '项目评审表，存储教师对项目的评审记录';

-- 显示表结构信息
SELECT 
    table_name,
    string_agg(column_name || ' (' || data_type || ')', ', ') as columns
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'projects', 'project_reviews')
GROUP BY table_name;

-- ===========================================
-- 完成提示
-- ===========================================

SELECT '🎉 数据库初始化完成！' as message;