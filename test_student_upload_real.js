import axios from 'axios';

// 使用真实测试账号测试学生上传
async function testStudentUploadReal() {
  console.log('=== 使用真实测试账号测试学生上传 ===');
  
  try {
    // 1. 使用测试学生账号登录
    console.log('1. 测试学生账号登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'studentdemo@example.com',
      password: 'demo123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，Token:', token.substring(0, 20) + '...');
    
    // 2. 获取成果类型
    console.log('\n2. 获取成果类型...');
    const typesResponse = await axios.get('http://localhost:3000/api/achievement-types', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const achievementTypes = typesResponse.data.data;
    console.log('✅ 获取成果类型成功，数量:', achievementTypes.length);
    
    if (achievementTypes.length === 0) {
      console.log('❌ 没有可用的成果类型');
      return;
    }
    
    // 3. 创建一个测试图片（Base64格式）
    console.log('\n3. 创建测试图片...');
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    // 4. 测试Base64上传
    console.log('\n4. 测试Base64上传...');
    try {
      const base64Response = await axios.post('http://localhost:3000/api/upload-simple/base64-simple', {
        imageData: testImageBase64,
        fileName: 'test-image.png'
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Base64上传成功:', base64Response.data);
      
    } catch (base64Error) {
      console.log('❌ Base64上传失败:', base64Error.response?.data || base64Error.message);
    }
    
    // 5. 测试学生成果提交
    console.log('\n5. 测试学生成果提交...');
    
    const submitData = {
      title: '测试学生成果-' + new Date().toISOString(),
      content_html: '<p>这是一个测试成果的内容</p>',
      video_url: testImageBase64, // 使用Base64数据作为封面图
      category: achievementTypes[0].id
    };
    
    console.log('提交数据:', {
      ...submitData,
      video_url: submitData.video_url.substring(0, 50) + '...'
    });
    
    try {
      const submitResponse = await axios.post('http://localhost:3000/api/projects', submitData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ 成果提交成功:', submitResponse.data);
      console.log('成果ID:', submitResponse.data.data.project_id);
      
      // 6. 验证成果是否创建成功
      console.log('\n6. 验证成果创建...');
      const projectId = submitResponse.data.data.project_id;
      const verifyResponse = await axios.get(`http://localhost:3000/api/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ 成果验证成功:', verifyResponse.data);
      if (verifyResponse.data.data.cover_url) {
        console.log('封面图URL:', verifyResponse.data.data.cover_url.substring(0, 50) + '...');
      } else {
        console.log('封面图URL: null');
      }
      
    } catch (submitError) {
      console.log('❌ 成果提交失败:', submitError.response?.data || submitError.message);
      if (submitError.response?.data) {
        console.log('错误详情:', JSON.stringify(submitError.response.data, null, 2));
        
        // 如果是验证错误，打印详细信息
        if (submitError.response.data.validation) {
          console.log('验证错误:', submitError.response.data.validation);
        }
      }
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应错误:', error.response.data);
    }
  }
}

testStudentUploadReal().catch(console.error);