-- 安全的存储桶创建脚本（无需超级用户权限）
-- 请在Supabase Dashboard的SQL Editor中执行

-- 1. 检查当前存储桶状态（只读查询，不会报错）
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

-- 2. 尝试创建存储桶（如果不存在）
-- 注意：这个操作需要适当的权限，如果失败请使用Supabase控制台手动创建
DO $$
BEGIN
  -- 尝试创建 project-images 存储桶
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-images') THEN
    BEGIN
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('project-images', 'project-images', true, 5242880, ARRAY['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp']);
      RAISE NOTICE '✅ project-images 存储桶创建成功';
    EXCEPTION 
      WHEN insufficient_privilege THEN
        RAISE NOTICE '⚠️ 无法创建 project-images 存储桶：权限不足';
        RAISE NOTICE '请手动在Supabase控制台中创建存储桶';
      WHEN OTHERS THEN
        RAISE NOTICE '⚠️ 创建 project-images 存储桶失败: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'ℹ️ project-images 存储桶已存在';
  END IF;

  -- 尝试创建 project-videos 存储桶
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-videos') THEN
    BEGIN
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('project-videos', 'project-videos', true, 52428800, ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv']);
      RAISE NOTICE '✅ project-videos 存储桶创建成功';
    EXCEPTION 
      WHEN insufficient_privilege THEN
        RAISE NOTICE '⚠️ 无法创建 project-videos 存储桶：权限不足';
        RAISE NOTICE '请手动在Supabase控制台中创建存储桶';
      WHEN OTHERS THEN
        RAISE NOTICE '⚠️ 创建 project-videos 存储桶失败: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'ℹ️ project-videos 存储桶已存在';
  END IF;
END $$;

-- 3. 验证存储桶状态
SELECT 
  id as bucket_id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('project-images', 'project-videos');

-- 4. 如果SQL创建失败，提供手动创建的指导
SELECT 
  '如果上述创建失败，请按以下步骤手动创建存储桶：' as instruction,
  '1. 登录Supabase Dashboard' as step1,
  '2. 进入Storage页面' as step2,
  '3. 点击"Create bucket"按钮' as step3,
  '4. 创建project-images存储桶（公开，5MB限制，允许图片格式）' as step4,
  '5. 创建project-videos存储桶（公开，50MB限制，允许视频格式）' as step5;