import { supabaseAdmin, BUCKET_NAMES } from './src/config/supabase.js'

async function checkBuckets() {
  try {
    console.log('=== 检查 Supabase 存储桶状态 ===')
    
    // 检查 project-images 存储桶
    console.log('检查存储桶:', BUCKET_NAMES.PROJECT_IMAGES)
    const { data: imageBucket, error: imageError } = await supabaseAdmin.storage.getBucket(BUCKET_NAMES.PROJECT_IMAGES)
    
    if (imageError) {
      console.error('存储桶检查失败:', imageError)
      
      // 尝试创建存储桶
      console.log('尝试创建存储桶...')
      const { data: createData, error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAMES.PROJECT_IMAGES, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      })
      
      if (createError) {
        console.error('创建存储桶失败:', createError)
      } else {
        console.log('存储桶创建成功:', createData)
      }
    } else {
      console.log('存储桶存在:', imageBucket)
    }
    
    // 检查存储桶的公共访问设置
    console.log('检查存储桶公共访问设置...')
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAMES.PROJECT_IMAGES)
      .getPublicUrl('test-file-path')
    
    console.log('公共URL测试:', publicUrlData)
    
  } catch (error) {
    console.error('检查过程出错:', error)
  }
}

checkBuckets()