import { supabaseAdmin } from './src/config/supabase.js';

async function createBucketsSafely() {
  console.log('=== 尝试安全创建存储桶 ===');
  
  try {
    // 1. 检查现有存储桶
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.log('列出存储桶失败:', listError.message);
      return;
    }
    
    console.log('现有存储桶:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.id} (public: ${bucket.public})`);
    });
    
    // 2. 尝试创建project-images存储桶
    const imageBucketExists = buckets.some(b => b.id === 'project-images');
    if (!imageBucketExists) {
      console.log('\n尝试创建project-images存储桶...');
      const { data: imageData, error: imageError } = await supabaseAdmin.storage.createBucket('project-images', {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp']
      });
      
      if (imageError) {
        console.log('❌ 创建project-images失败:', imageError.message);
      } else {
        console.log('✅ 创建project-images成功');
      }
    } else {
      console.log('ℹ️ project-images已存在');
    }
    
    // 3. 尝试创建project-videos存储桶
    const videoBucketExists = buckets.some(b => b.id === 'project-videos');
    if (!videoBucketExists) {
      console.log('\n尝试创建project-videos存储桶...');
      const { data: videoData, error: videoError } = await supabaseAdmin.storage.createBucket('project-videos', {
        public: true,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
      });
      
      if (videoError) {
        console.log('❌ 创建project-videos失败:', videoError.message);
      } else {
        console.log('✅ 创建project-videos成功');
      }
    } else {
      console.log('ℹ️ project-videos已存在');
    }
    
    // 4. 最终状态检查
    const { data: finalBuckets } = await supabaseAdmin.storage.listBuckets();
    console.log('\n=== 最终存储桶状态 ===');
    finalBuckets.forEach(bucket => {
      console.log(`- ${bucket.id} (public: ${bucket.public}, sizeLimit: ${bucket.fileSizeLimit})`);
    });
    
  } catch (error) {
    console.error('存储桶操作失败:', error.message);
  }
}

createBucketsSafely().catch(console.error);