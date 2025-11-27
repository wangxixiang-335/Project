-- 检查achievements表的列信息，特别是cover_url列
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable,
    character_maximum_length
FROM 
    information_schema.columns
WHERE 
    table_name = 'achievements' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 特别检查cover_url列的默认值
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'achievements' 
    AND table_schema = 'public'
    AND column_name = 'cover_url';