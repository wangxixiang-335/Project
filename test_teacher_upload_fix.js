// 测试教师上传修复方案
import axios from 'axios'
import FormData from 'form-data'

const API_BASE_URL = 'http://localhost:3000/api'

async function testTeacherUploadFix() {
  try {
    console.log('🧪 测试教师上传修复方案...')
    
    // 使用开发者token进行测试
    const devToken = 'dev-teacher-token'
    
    // 创建一个简单的测试图片（base64格式）
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const imageBuffer = Buffer.from(testImageBase64, 'base64')
    
    // 测试1：Service Role上传方案
    console.log('\n📤 测试1: Service Role上传方案...')
    try {
      const formData1 = new FormData()
      formData1.append('image', imageBuffer, {
        filename: 'test-service.png',
        contentType: 'image/png'
      })
      
      const response1 = await axios.post(`${API_BASE_URL}/upload-alt/teacher-image-service`, formData1, {
        headers: {
          'Authorization': `Bearer ${devToken}`,
          ...formData1.getHeaders()
        }
      })
      
      console.log('✅ Service Role上传成功:', response1.data)
    } catch (error1) {
      console.log('❌ Service Role上传失败:', error1.response?.data || error1.message)
    }
    
    // 测试2：备用上传方案
    console.log('\n📤 测试2: 备用上传方案...')
    try {
      const formData2 = new FormData()
      formData2.append('image', imageBuffer, {
        filename: 'test-alt.png',
        contentType: 'image/png'
      })
      
      const response2 = await axios.post(`${API_BASE_URL}/upload-alt/teacher-image-alt`, formData2, {
        headers: {
          'Authorization': `Bearer ${devToken}`,
          ...formData2.getHeaders()
        }
      })
      
      console.log('✅ 备用方案上传成功:', response2.data)
    } catch (error2) {
      console.log('❌ 备用方案上传失败:', error2.response?.data || error2.message)
    }
    
    // 测试3：原始上传方案（对比）
    console.log('\n📤 测试3: 原始上传方案...')
    try {
      const formData3 = new FormData()
      formData3.append('image', imageBuffer, {
        filename: 'test-original.png',
        contentType: 'image/png'
      })
      
      const response3 = await axios.post(`${API_BASE_URL}/upload/teacher-image`, formData3, {
        headers: {
          'Authorization': `Bearer ${devToken}`,
          ...formData3.getHeaders()
        }
      })
      
      console.log('✅ 原始方案上传成功:', response3.data)
    } catch (error3) {
      console.log('❌ 原始方案上传失败:', error3.response?.data || error3.message)
    }
    
    console.log('\n🎉 测试完成！')
    
  } catch (error) {
    console.error('测试失败:', error.message)
  }
}

testTeacherUploadFix().then(() => {
  console.log('测试结束')
  process.exit(0)
}).catch(err => {
  console.error('测试错误:', err)
  process.exit(1)
})