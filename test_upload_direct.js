import { supabase } from './src/config/supabase.js'
import fs from 'fs'

async function testDirectUpload() {
  try {
    // 创建一个简单的测试图片（1x1像素的base64图片）
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const imageBuffer = Buffer.from(testImageBase64, 'base64')
    
    console.log('测试直接上传到Supabase...')
    
    // 生成文件名
    const fileName = `direct-test-${Date.now()}.png`
    const filePath = `test/${fileName}`
    
    // 先检查存储桶是否存在
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    if (bucketError) {
      console.error('获取存储桶失败:', bucketError)
      return
    }
    
    console.log('可用存储桶:', buckets.map(b => b.id))
    
    // 尝试直接上传
    const { data, error } = await supabase.storage
      .from('project-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      })
    
    if (error) {
      console.error('上传错误详情:', {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        error: error
      })
    } else {
      console.log('上传成功:', data)
      
      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath)
      
      console.log('图片公共URL:', publicUrl)
    }
    
  } catch (error) {
    console.error('测试错误:', error)
  }
}

testDirectUpload().then(() => {
  console.log('测试完成')
  process.exit(0)
}).catch(err => {
  console.error('测试错误:', err)
  process.exit(1)
})