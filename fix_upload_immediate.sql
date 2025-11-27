-- 立即修复上传问题的SQL脚本
-- 请在Supabase Dashboard的SQL Editor中执行

-- 1. 检查当前存储桶状态
SELECT 
  id as bucket_id,
  name, 
  public, 
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id IN ('project-images', 'project-videos')
ORDER BY id;

-- 2. 如果存储桶不存在，手动创建它们
-- 注意：如果这一步失败，请检查您的Supabase权限设置
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('project-images', 'project-images', true, 5242880, ARRAY['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp']),
  ('project-videos', 'project-videos', true, 52428800, ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. 确保storage.objects表存在并启用RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. 删除现有的存储桶策略（如果存在）
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- 5. 创建新的存储桶策略
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('project-images', 'project-videos'));

CREATE POLICY "Allow all users to read files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('project-images', 'project-videos'));

CREATE POLICY "Allow users to delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('project-images', 'project-videos'));

-- 6. 验证存储桶是否创建成功
SELECT 
  id as bucket_id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('project-images', 'project-videos');

-- 7. 检查当前存储桶中的对象数量
SELECT 
  bucket_id,
  COUNT(*) as object_count
FROM storage.objects 
WHERE bucket_id IN ('project-images', 'project-videos')
GROUP BY bucket_id;

SELECT '🎉 存储桶修复完成！如果还有问题，请检查Supabase控制台中的存储设置。' as status;