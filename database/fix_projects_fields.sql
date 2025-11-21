-- 添加缺失的字段到projects表

-- 添加view_count字段（浏览量统计）
ALTER TABLE projects ADD COLUMN view_count INTEGER DEFAULT 0;

-- 添加reject_reason字段（打回原因）
ALTER TABLE projects ADD COLUMN reject_reason TEXT;

-- 添加audited_at字段（审核时间）
ALTER TABLE projects ADD COLUMN audited_at TIMESTAMP WITH TIME ZONE;

-- 添加images_array字段（图片数组）
ALTER TABLE projects ADD COLUMN images_array TEXT[] DEFAULT '{}';

-- 添加category字段（项目分类）
ALTER TABLE projects ADD COLUMN category TEXT;

-- 创建相应的索引
CREATE INDEX projects_view_count_idx ON projects(view_count);
CREATE INDEX projects_audited_at_idx ON projects(audited_at);
CREATE INDEX projects_category_idx ON projects(category);

-- 验证字段添加成功
SELECT '✅ view_count字段添加成功' as result WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'view_count'
);

SELECT '✅ reject_reason字段添加成功' as result WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'reject_reason'
);

SELECT '✅ audited_at字段添加成功' as result WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'audited_at'
);

SELECT '✅ images_array字段添加成功' as result WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'images_array'
);

SELECT '✅ category字段添加成功' as result WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'category'
);

-- 显示更新后的表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;