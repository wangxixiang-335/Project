// Node.js 18+ 内置fetch
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

const API_BASE = 'http://localhost:3000/api'
const TEST_IMAGE_PATH = path.join(process.cwd(), 'uploads', 'images', 'test-image.jpg')

async function testRichTextUpload() {
  try {
    console.log('=== 测试富文本编辑器图片上传功能 ===\n')
    
    // 1. 检查服务器是否运行
    console.log('1. 检查服务器状态...')
    const healthResponse = await fetch(`${API_BASE}/health`)
    if (healthResponse.ok) {
      console.log('✅ 服务器运行正常')
    } else {
      throw new Error('服务器未运行或无法访问')
    }
    
    // 2. 创建测试图片
    console.log('\n2. 创建测试图片...')
    await createTestImage()
    
    // 3. 测试直接文件上传
    console.log('\n3. 测试直接文件上传...')
    await testDirectUpload()
    
    // 4. 测试Base64上传
    console.log('\n4. 测试Base64图片上传...')
    await testBase64Upload()
    
    // 5. 测试图片访问
    console.log('\n5. 测试图片访问...')
    await testImageAccess()
    
    console.log('\n🎉 所有测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 创建测试图片
async function createTestImage() {
  // 创建一个简单的1x1像素的JPEG图片的Base64数据
  const jpegBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=='
  
  const buffer = Buffer.from(jpegBase64, 'base64')
  
  // 确保目录存在
  const uploadsDir = path.join(process.cwd(), 'uploads', 'images')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
  
  // 写入测试图片
  fs.writeFileSync(TEST_IMAGE_PATH, buffer)
  console.log('✅ 测试图片创建成功:', TEST_IMAGE_PATH)
}

// 测试直接文件上传
async function testDirectUpload() {
  try {
    const formData = new FormData()
    formData.append('file', fs.createReadStream(TEST_IMAGE_PATH), {
      filename: 'test-upload.jpg',
      contentType: 'image/jpeg'
    })
    
    const response = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        ...formData.getHeaders()
      },
      body: formData
    })
    
    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log('✅ 直接文件上传成功')
      console.log('   URL:', result.data.url)
      console.log('   存储方式:', result.data.storage_type)
    } else {
      console.log('⚠️ 直接文件上传部分失败:', result.message)
      console.log('   响应:', JSON.stringify(result, null, 2))
    }
    
  } catch (error) {
    console.error('❌ 直接文件上传失败:', error.message)
  }
}

// 测试Base64上传
async function testBase64Upload() {
  try {
    // 读取测试图片并转换为Base64
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH)
    const base64Data = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
    
    const response = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageData: base64Data,
        fileName: 'test-base64.jpg'
      })
    })
    
    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log('✅ Base64图片上传成功')
      console.log('   URL:', result.data.url)
      console.log('   存储方式:', result.data.storage_type)
    } else {
      console.log('⚠️ Base64图片上传部分失败:', result.message)
      console.log('   响应:', JSON.stringify(result, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Base64图片上传失败:', error.message)
  }
}

// 测试图片访问
async function testImageAccess() {
  try {
    // 测试静态文件服务
    const testUrls = [
      'http://localhost:3000/uploads/images/test-image.jpg',
      'http://localhost:3000/uploads/images/nonexistent.jpg'
    ]
    
    for (const url of testUrls) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          console.log(`✅ 图片访问成功: ${url}`)
        } else {
          console.log(`⚠️ 图片访问失败 (${response.status}): ${url}`)
        }
      } catch (error) {
        console.log(`❌ 图片访问错误: ${url} - ${error.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ 图片访问测试失败:', error.message)
  }
}

// 执行测试
testRichTextUpload()