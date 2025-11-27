import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

// 模拟学生上传成果的完整流程
async function testStudentUpload() {
  console.log('=== 测试学生上传成果流程 ===');
  
  try {
    // 1. 首先登录获取token
    console.log('1. 学生登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'student@example.com',
      password: '123456'
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
    
    console.log('提交数据:', submitData);
    
    try {
      const submitResponse = await axios.post('http://localhost:3000/api/projects', submitData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ 成果提交成功:', submitResponse.data);
      console.log('成果ID:', submitResponse.data.data.project_id);
      
    } catch (submitError) {
      console.log('❌ 成果提交失败:', submitError.response?.data || submitError.message);
      if (submitError.response?.data) {
        console.log('错误详情:', JSON.stringify(submitError.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应错误:', error.response.data);
    }
  }
}

testStudentUpload().catch(console.error);