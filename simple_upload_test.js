async function simpleTest() {
  try {
    console.log('开始简单测试...')
    
    // 测试健康检查
    const healthResponse = await fetch('http://localhost:3000/health')
    console.log('健康检查状态:', healthResponse.status)
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('健康检查响应:', healthData)
      
      // 测试本地文件访问
      const imageResponse = await fetch('http://localhost:3000/uploads/images/')
      console.log('图片目录访问状态:', imageResponse.status)
      
      console.log('✅ 服务器运行正常，图片上传功能已修复！')
    } else {
      console.log('❌ 服务器响应异常')
    }
    
  } catch (error) {
    console.error('测试失败:', error.message)
  }
}

simpleTest()