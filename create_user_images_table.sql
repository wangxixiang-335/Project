-- 创建user_images表用于Base64图片存储
-- 请在Supabase Dashboard的SQL Editor中执行

-- 创建user_images表
CREATE TABLE IF NOT EXISTS public.user_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_data TEXT NOT NULL, -- 存储Base64图片数据
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_images_user_id ON public.user_images(user_id);
CREATE INDEX IF NOT EXISTS idx_user_images_created_at ON public.user_images(created_at);

-- 启用RLS
ALTER TABLE public.user_images ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户可以查看自己的图片
CREATE POLICY "用户可以查看自己的图片" ON public.user_images
  FOR SELECT USING (user_id = auth.uid());

-- 创建RLS策略：用户可以插入自己的图片
CREATE POLICY "用户可以插入自己的图片" ON public.user_images
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 创建RLS策略：用户可以更新自己的图片
CREATE POLICY "用户可以更新自己的图片" ON public.user_images
  FOR UPDATE USING (user_id = auth.uid());

-- 创建RLS策略：用户可以删除自己的图片
CREATE POLICY "用户可以删除自己的图片" ON public.user_images
  FOR DELETE USING (user_id = auth.uid());

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_images_updated_at 
  BEFORE UPDATE ON public.user_images 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 验证表创建
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_images' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 验证RLS策略
SELECT 
  policyname,
  tablename,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_images' AND schemaname = 'public';

SELECT '🎉 user_images表创建完成！' as status;