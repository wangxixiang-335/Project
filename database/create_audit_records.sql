-- 创建audit_records表，用于存储审核记录
CREATE TABLE IF NOT EXISTS audit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    auditor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    audit_result INTEGER NOT NULL CHECK (audit_result IN (1, 2)), -- 1=通过, 2=不通过
    reject_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS audit_records_project_id_idx ON audit_records(project_id);
CREATE INDEX IF NOT EXISTS audit_records_auditor_id_idx ON audit_records(auditor_id);
CREATE INDEX IF NOT EXISTS audit_records_audit_result_idx ON audit_records(audit_result);
CREATE INDEX IF NOT EXISTS audit_records_created_at_idx ON audit_records(created_at);

-- 启用行级安全
ALTER TABLE audit_records ENABLE ROW LEVEL SECURITY;

-- RLS策略
DROP POLICY IF EXISTS "用户可以查看自己的审核记录" ON audit_records;
CREATE POLICY "用户可以查看自己的审核记录" ON audit_records
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM projects WHERE id = project_id
        )
    );

DROP POLICY IF EXISTS "教师可以管理审核记录" ON audit_records;
CREATE POLICY "教师可以管理审核记录" ON audit_records
    FOR ALL USING (
        auth.uid() = auditor_id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- 服务端可以插入审核记录
DROP POLICY IF EXISTS "服务端可以插入审核记录" ON audit_records;
CREATE POLICY "服务端可以插入审核记录" ON audit_records
    FOR INSERT WITH CHECK (true);

-- 验证表创建成功
SELECT '✅ audit_records表创建成功' as result WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_records');