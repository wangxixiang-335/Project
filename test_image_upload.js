import { supabase, supabaseAdmin } from './src/config/supabase.js'
import fs from 'fs'
import path from 'path'
import FormData from 'form-data'
import axios from 'axios'

async function testImageUpload() {
  try {
    // 创建一个简单的测试图片（1x1像素的base64图片）
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const imageBuffer = Buffer.from(testImageBase64, 'base64')
    
    // 创建FormData对象
    const formData = new FormData()
    formData.append('image', imageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    })
    
    console.log('测试图片上传...')
    
    // 模拟API调用
    try {
      // 先尝试直接上传到Supabase Storage
      const fileName = `test-${Date.now()}.png`
      const filePath = `test/${fileName}`
      
      const { data, error } = await supabaseAdmin.storage
        .from('project-images')
        .upload(filePath, imageBuffer, {
          contentType: 'image/png',
          upsert: false
        })
      
      if (error) {
        console.error('Supabase上传错误:', error)
      } else {
        console.log('Supabase上传成功:', data)
        
        // 获取公共URL
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('project-images')
          .getPublicUrl(filePath)
        
        console.log('图片公共URL:', publicUrl)
      }
    } catch (uploadError) {
      console.error('上传错误:', uploadError)
    }
    
  } catch (error) {
    console.error('测试错误:', error)
  }
}

testImageUpload().then(() => {
  console.log('测试完成')
  process.exit(0)
}).catch(err => {
  console.error('测试错误:', err)
  process.exit(1)
})