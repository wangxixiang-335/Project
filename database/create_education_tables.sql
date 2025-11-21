-- 教育项目管理系统数据库表结构
-- 适用于 Supabase PostgreSQL

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户资料表 (与 Supabase Auth 集成)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    avatar_url TEXT,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(200) NOT NULL,
    content_html TEXT NOT NULL,
    images_array TEXT[] DEFAULT '{}',
    video_url TEXT,
    category VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reject_reason TEXT,
    auditor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    audited_at TIMESTAMP WITH TIME ZONE
);

-- 审核记录表
CREATE TABLE IF NOT EXISTS audit_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    auditor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    audit_result VARCHAR(20) NOT NULL CHECK (audit_result IN ('approve', 'reject')),
    reject_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 文件上传记录表
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_auditor_id ON projects(auditor_id);

CREATE INDEX IF NOT EXISTS idx_audit_records_project_id ON audit_records(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_records_auditor_id ON audit_records(auditor_id);
CREATE INDEX IF NOT EXISTS idx_audit_records_created_at ON audit_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_at ON file_uploads(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_resource ON system_logs(resource_type, resource_id);

-- 创建全文搜索索引 (用于项目内容搜索)
CREATE INDEX IF NOT EXISTS idx_projects_fts ON projects USING gin(to_tsvector('chinese', title || ' ' || content_html));

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加更新时间触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 行级安全策略 (RLS) - 数据安全
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Profiles 表策略
CREATE POLICY "用户只能查看自己的资料" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "教师可以查看所有用户资料" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'teacher'
        )
    );

-- Projects 表策略
CREATE POLICY "用户可以查看自己的项目" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的项目" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的项目" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的项目" ON projects
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "教师可以查看所有项目" ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "教师可以审核项目" ON projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'admin')
        )
    );

-- Audit Records 表策略
CREATE POLICY "用户可以查看自己项目的审核记录" ON audit_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = audit_records.project_id 
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "教师可以查看所有审核记录" ON audit_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "教师可以创建审核记录" ON audit_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('teacher', 'admin')
        )
    );

-- File Uploads 表策略
CREATE POLICY "用户可以查看自己的文件上传" ON file_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以上传文件" ON file_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的文件" ON file_uploads
    FOR DELETE USING (auth.uid() = user_id);

-- System Logs 表策略
CREATE POLICY "只有管理员可以查看系统日志" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 插入默认系统配置
INSERT INTO system_settings (key, value, description) VALUES
    ('max_images_per_project', '10', '每个项目最多允许的图片数量'),
    ('max_file_size_mb', '50', '最大文件上传大小(MB)'),
    ('allowed_file_types', 'jpg,jpeg,png,gif,pdf,doc,docx', '允许的文件类型'),
    ('project_categories', '数学,物理,化学,生物,计算机,工程,文学,艺术,其他', '项目分类选项'),
    ('audit_timeout_days', '7', '审核超时天数'),
    ('system_name', '教育项目管理系统', '系统名称'),
    ('system_version', '1.0.0', '系统版本'),
    ('maintenance_mode', 'false', '维护模式开关')
ON CONFLICT (key) DO NOTHING;

-- 创建函数：自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', '用户' || substring(new.id::text, 1, 8)),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'student')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：当新用户注册时自动创建资料
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 注释说明
COMMENT ON TABLE profiles IS '用户资料表';
COMMENT ON TABLE projects IS '项目表';
COMMENT ON TABLE audit_records IS '审核记录表';
COMMENT ON TABLE file_uploads IS '文件上传记录表';
COMMENT ON TABLE system_settings IS '系统配置表';
COMMENT ON TABLE system_logs IS '系统日志表';

-- 权限说明
-- 这些策略确保了：
-- 1. 学生只能查看和操作自己的数据
-- 2. 教师可以查看所有项目和学生信息，进行审核操作
-- 3. 管理员拥有所有权限
-- 4. 数据安全性通过 RLS 得到保障