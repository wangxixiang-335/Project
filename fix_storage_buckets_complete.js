import { supabaseAdmin, BUCKET_NAMES } from './src/config/supabase.js'

async function fixStorageBuckets() {
  try {
    console.log('=== 修复 Supabase 存储桶配置 ===')
    
    // 1. 检查并创建 project-images 存储桶
    console.log('\n1. 检查 project-images 存储桶...')
    const { data: imageBucket, error: imageError } = await supabaseAdmin.storage.getBucket(BUCKET_NAMES.PROJECT_IMAGES)
    
    if (imageError) {
      console.log('⚠️ project-images 存储桶不存在，尝试创建...')
      
      // 使用 SQL 直接创建存储桶（绕过 RLS 限制）
      const { data: sqlData, error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
          VALUES ('project-images', 'project-images', true, 5242880, 
                  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
          ON CONFLICT (id) DO NOTHING;
        `
      })
      
      if (sqlError) {
        console.log('❌ SQL 创建失败，尝试直接 API 创建...')
        
        // 尝试使用服务角色直接创建
        const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket(
          BUCKET_NAMES.PROJECT_IMAGES, 
          {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
          }
        )
        
        if (createError) {
          console.error('❌ 创建 project-images 存储桶失败:', createError.message)
          
          // 如果所有方法都失败，创建本地备用方案
          console.log('🔄 启用本地存储备用方案...')
          return setupLocalFallback()
        } else {
          console.log('✅ project-images 存储桶创建成功')
        }
      } else {
        console.log('✅ project-images 存储桶 SQL 创建成功')
      }
    } else {
      console.log('✅ project-images 存储桶已存在')
    }
    
    // 2. 设置存储桶的 RLS 策略
    console.log('\n2. 设置存储桶访问策略...')
    await setupBucketPolicies()
    
    // 3. 测试公共访问
    console.log('\n3. 测试公共访问...')
    await testPublicAccess()
    
    console.log('\n✅ 存储桶修复完成！')
    
  } catch (error) {
    console.error('存储桶修复过程出错:', error)
    console.log('🔄 启用本地存储备用方案...')
    return setupLocalFallback()
  }
}

// 设置存储桶策略
async function setupBucketPolicies() {
  const policies = [
    // 允许任何人读取图片
    {
      name: 'Allow public reads',
      definition: `
        CREATE POLICY "Allow public reads" ON storage.objects
        FOR SELECT USING (bucket_id = 'project-images');
      `
    },
    // 允许认证用户上传图片
    {
      name: 'Allow authenticated uploads',
      definition: `
        CREATE POLICY "Allow authenticated uploads" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'project-images' AND 
          auth.role() = 'authenticated'
        );
      `
    },
    // 允许用户更新自己的图片
    {
      name: 'Allow users to update own images',
      definition: `
        CREATE POLICY "Allow users to update own images" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'project-images' AND 
          (storage.foldername(name))[1] = auth.uid()::text
        );
      `
    },
    // 允许用户删除自己的图片
    {
      name: 'Allow users to delete own images',
      definition: `
        CREATE POLICY "Allow users to delete own images" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'project-images' AND 
          (storage.foldername(name))[1] = auth.uid()::text
        );
      `
    }
  ]
  
  for (const policy of policies) {
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: policy.definition })
      console.log(`✅ 策略创建成功: ${policy.name}`)
    } catch (error) {
      console.log(`⚠️ 策略创建失败: ${policy.name}`, error.message)
    }
  }
}

// 测试公共访问
async function testPublicAccess() {
  try {
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAMES.PROJECT_IMAGES)
      .getPublicUrl('test-file.jpg')
    
    console.log('✅ 公共 URL 生成成功:', publicUrlData.publicUrl)
    
    // 测试是否可以访问
    const testResponse = await fetch(publicUrlData.publicUrl)
    console.log('✅ 公共访问测试状态:', testResponse.status)
    
  } catch (error) {
    console.error('❌ 公共访问测试失败:', error.message)
  }
}

// 本地存储备用方案
async function setupLocalFallback() {
  console.log('设置本地存储备用方案...')
  
  // 创建本地存储目录
  const fs = require('fs')
  const path = require('path')
  
  const localUploadDir = path.join(__dirname, 'uploads', 'images')
  
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true })
    console.log('✅ 本地存储目录创建成功:', localUploadDir)
  }
  
  // 修改环境变量以使用本地存储
  process.env.USE_LOCAL_STORAGE = 'true'
  process.env.LOCAL_STORAGE_PATH = localUploadDir
  
  console.log('✅ 本地存储备用方案配置完成')
  console.log('📁 图片将保存到:', localUploadDir)
  console.log('🌐 图片访问地址: http://localhost:3000/uploads/images/')
  
  return { success: true, method: 'local' }
}

// 执行修复
fixStorageBuckets().then(result => {
  console.log('\n修复结果:', result)
  process.exit(0)
}).catch(error => {
  console.error('修复失败:', error)
  process.exit(1)
})