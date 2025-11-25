-- 删除projects_view视图
-- 这个视图是基于achievements表的兼容视图，现在系统已完全迁移到achievements表

DROP VIEW IF EXISTS public.projects_view;

-- 验证删除成功
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'projects_view';