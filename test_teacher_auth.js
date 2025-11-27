// 测试教师认证
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

async function testTeacherAuth() {
  try {
    console.log('测试教师认证...')
    
    // 使用开发者token进行测试
    const devToken = 'dev-teacher-token'
    
    // 测试教师发布API
    console.log('测试教师发布API...')
    const publishData = {
      title: '测试教师发布',
      content_html: '<p>测试内容</p>',
      video_url: 'https://via.placeholder.com/400x300.png',
      category: 'ece36ff7-1bd5-4a81-a2a7-59fa0722cb07'
    }
    
    const response = await axios.post(`${API_BASE_URL}/projects/teacher-publish`, publishData, {
      headers: {
        'Authorization': `Bearer ${devToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('发布成功:', response.data)
    
    // 测试图片上传API
    console.log('测试教师图片上传API...')
    
    // 创建一个简单的测试图片（base64格式）
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const imageBuffer = Buffer.from(testImageBase64, 'base64')
    
    // 创建FormData
    const FormData = (await import('form-data')).default
    const formData = new FormData()
    formData.append('image', imageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    })
    
    const uploadResponse = await axios.post(`${API_BASE_URL}/upload/teacher-image`, formData, {
      headers: {
        'Authorization': `Bearer ${devToken}`,
        ...formData.getHeaders()
      }
    })
    
    console.log('图片上传成功:', uploadResponse.data)
    
  } catch (error) {
    console.error('测试失败:', error.message)
    if (error.response) {
      console.error('错误响应:', error.response.data)
      console.error('状态码:', error.response.status)
    }
  }
}

testTeacherAuth().then(() => {
  console.log('测试完成')
  process.exit(0)
}).catch(err => {
  console.error('测试错误:', err)
  process.exit(1)
})