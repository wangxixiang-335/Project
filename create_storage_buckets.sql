-- 创建Supabase存储桶
-- 请在Supabase Dashboard的SQL Editor中执行以下语句：

-- 1. 检查并创建 project-images 存储桶
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-images') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('project-images', 'project-images', true, 5242880, ARRAY['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp']);
    RAISE NOTICE '✅ project-images 存储桶创建成功';
  ELSE
    RAISE NOTICE 'ℹ️ project-images 存储桶已存在';
  END IF;
END $$;

-- 2. 检查并创建 project-videos 存储桶
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-videos') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('project-videos', 'project-videos', true, 52428800, ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv']);
    RAISE NOTICE '✅ project-videos 存储桶创建成功';
  ELSE
    RAISE NOTICE 'ℹ️ project-videos 存储桶已存在';
  END IF;
END $$;

-- 3. 为存储桶表启用RLS（如果不存在）
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. 删除可能存在的旧策略
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- 5. 创建新的RLS策略
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('project-images', 'project-videos'));

CREATE POLICY "Allow all users to read files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('project-images', 'project-videos'));

CREATE POLICY "Allow users to delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('project-images', 'project-videos') AND (storage.foldername(name))[1] = auth.uid()::text);

-- 6. 验证存储桶创建
SELECT 
  id as bucket_id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('project-images', 'project-videos');

SELECT '🎉 存储桶创建和配置完成！' as status;