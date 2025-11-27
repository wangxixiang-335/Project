// 简单的认证测试
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

async function testSimpleAuth() {
  try {
    console.log('测试简单认证...')
    
    // 1. 首先测试无token访问（应该失败）
    console.log('1. 测试无token访问...')
    try {
      const response1 = await axios.get(`${API_BASE_URL}/teacher/dashboard`)
      console.log('无token访问成功（不应该发生）:', response1.data)
    } catch (error) {
      console.log('无token访问失败（预期）:', error.response?.status, error.response?.data?.error)
    }
    
    // 2. 使用开发者token测试
    console.log('\n2. 使用开发者token测试...')
    const devToken = 'dev-teacher-token'
    
    const response2 = await axios.get(`${API_BASE_URL}/teacher/dashboard`, {
      headers: {
        'Authorization': `Bearer ${devToken}`
      }
    })
    
    console.log('开发者token访问成功:', response2.data ? '有数据' : '无数据')
    
    // 3. 测试教师发布API的最小化数据
    console.log('\n3. 测试教师发布API（最小化数据）...')
    const minimalData = {
      title: '测试标题',
      content_html: '<p>测试内容</p>',
      category: 'ece36ff7-1bd5-4a81-a2a7-59fa0722cb07'
    }
    
    const response3 = await axios.post(`${API_BASE_URL}/projects/teacher-publish`, minimalData, {
      headers: {
        'Authorization': `Bearer ${devToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('教师发布成功:', response3.data)
    
  } catch (error) {
    console.error('测试失败:', error.message)
    if (error.response) {
      console.error('错误响应:', error.response.data)
      console.error('状态码:', error.response.status)
      console.error('Headers:', error.response.headers)
    }
  }
}

testSimpleAuth().then(() => {
  console.log('\n测试完成')
  process.exit(0)
}).catch(err => {
  console.error('测试错误:', err)
  process.exit(1)
})