-- 修复Supabase存储桶RLS策略
-- 请在Supabase Dashboard的SQL Editor中执行以下语句：

-- 1. 检查存储桶是否存在
SELECT * FROM storage.buckets WHERE id IN ('project-images', 'project-videos');

-- 2. 为存储桶启用RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. 创建存储桶RLS策略 - 允许所有认证用户上传文件
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('project-images', 'project-videos'));

-- 4. 创建存储桶RLS策略 - 允许所有用户读取文件
CREATE POLICY "Allow all users to read files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('project-images', 'project-videos'));

-- 5. 创建存储桶RLS策略 - 允许用户删除自己的文件
CREATE POLICY "Allow users to delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('project-images', 'project-videos') AND (storage.foldername(name))[1] = auth.uid()::text);

-- 6. 验证策略是否创建成功
SELECT 
  policyname,
  tablename,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 7. 测试查询（应该能正常访问）
SELECT COUNT(*) as object_count FROM storage.objects WHERE bucket_id = 'project-images';

SELECT '🎉 存储桶RLS策略修复完成！' as status;