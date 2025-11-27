import { supabaseAdmin, BUCKET_NAMES } from './src/config/supabase.js'

// 自动修复存储桶配置
async function fixStorageBuckets() {
  console.log('=== 开始修复Supabase存储桶 ===')
  
  try {
    // 1. 检查存储桶是否存在
    console.log('检查存储桶状态...')
    
    // 检查 project-images 存储桶
    const { data: imageBucket, error: imageError } = await supabaseAdmin.storage.getBucket(BUCKET_NAMES.PROJECT_IMAGES)
    
    if (imageError || !imageBucket) {
      console.log('project-images 存储桶不存在，尝试创建...')
      
      // 创建存储桶
      const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAMES.PROJECT_IMAGES, {
        public: true, // 允许公共访问
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
      
      if (createError) {
        console.error('创建存储桶失败:', createError)
        
        // 如果创建失败，尝试使用SQL直接创建
        console.log('尝试使用SQL创建存储桶...')
        const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
          sql: `
            INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
            VALUES ('${BUCKET_NAMES.PROJECT_IMAGES}', '${BUCKET_NAMES.PROJECT_IMAGES}', true, 5242880, '{"image/jpeg", "image/png", "image/webp", "image/gif"}')
            ON CONFLICT (id) DO NOTHING;
          `
        })
        
        if (sqlError) {
          console.error('SQL创建存储桶失败:', sqlError)
        } else {
          console.log('✅ 使用SQL成功创建存储桶')
        }
      } else {
        console.log('✅ 成功创建 project-images 存储桶')
      }
    } else {
      console.log('✅ project-images 存储桶已存在')
    }
    
    // 2. 检查并修复RLS策略
    console.log('检查RLS策略...')
    
    // 创建基础RLS策略
    const rlsPolicies = [
      {
        name: 'Allow authenticated users to upload files',
        sql: `
          CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload files" ON storage.objects
          FOR INSERT TO authenticated
          WITH CHECK (bucket_id IN ('${BUCKET_NAMES.PROJECT_IMAGES}', '${BUCKET_NAMES.PROJECT_VIDEOS}'));
        `
      },
      {
        name: 'Allow all users to read files',
        sql: `
          CREATE POLICY IF NOT EXISTS "Allow all users to read files" ON storage.objects
          FOR SELECT TO anon, authenticated
          USING (bucket_id IN ('${BUCKET_NAMES.PROJECT_IMAGES}', '${BUCKET_NAMES.PROJECT_VIDEOS}'));
        `
      },
      {
        name: 'Allow users to delete own files',
        sql: `
          CREATE POLICY IF NOT EXISTS "Allow users to delete own files" ON storage.objects
          FOR DELETE TO authenticated
          USING (bucket_id IN ('${BUCKET_NAMES.PROJECT_IMAGES}', '${BUCKET_NAMES.PROJECT_VIDEOS}') AND (storage.foldername(name))[1] = auth.uid()::text);
        `
      }
    ]
    
    // 执行RLS策略创建
    for (const policy of rlsPolicies) {
      try {
        console.log(`创建策略: ${policy.name}`)
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: policy.sql
        })
        
        if (error) {
          console.warn(`策略创建失败（可能已存在）: ${policy.name}`, error.message)
        } else {
          console.log(`✅ 策略创建成功: ${policy.name}`)
        }
      } catch (err) {
        console.warn(`策略创建异常: ${policy.name}`, err.message)
      }
    }
    
    // 3. 测试公共URL生成
    console.log('测试公共URL生成...')
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAMES.PROJECT_IMAGES)
      .getPublicUrl('test-file-path')
      
    console.log('公共URL测试:', publicUrl)
    
    console.log('=== 存储桶修复完成 ===')
    
  } catch (error) {
    console.error('存储桶修复失败:', error)
    
    // 备用方案：创建本地存储配置
    console.log('使用备用方案：创建本地存储配置...')
    
    // 创建本地存储目录
    const fs = await import('fs')
    const path = await import('path')
    
    const uploadDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
      console.log('✅ 创建本地上传目录:', uploadDir)
    }
    
    // 创建配置文件
    const config = {
      storageType: 'local',
      uploadPath: uploadDir,
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      buckets: {
        [BUCKET_NAMES.PROJECT_IMAGES]: {
          path: path.join(uploadDir, 'images'),
          public: true,
          maxSize: 5 * 1024 * 1024
        }
      }
    }
    
    const configPath = path.join(process.cwd(), 'storage-config.json')
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.log('✅ 创建本地存储配置文件:', configPath)
    
    console.log('📝 注意：当前使用本地存储方案，请确保配置了正确的文件服务')
  }
}

// 运行修复
fixStorageBuckets().catch(console.error)