-- 添加category字段到projects表
ALTER TABLE projects ADD COLUMN category TEXT;

-- 添加category字段的索引
CREATE INDEX projects_category_idx ON projects(category);

-- 验证字段添加成功
SELECT '✅ category字段添加成功' as result WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'category'
);

-- 显示更新后的表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;