-- 添加缺失的view_count和audited_at字段到projects表

-- 添加view_count字段（浏览量统计）
ALTER TABLE projects ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 添加audited_at字段（审核时间）
ALTER TABLE projects ADD COLUMN IF NOT EXISTS audited_at TIMESTAMP WITH TIME ZONE;

-- 添加reject_reason字段（打回原因）
ALTER TABLE projects ADD COLUMN IF NOT EXISTS reject_reason TEXT;

-- 验证字段添加成功
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;