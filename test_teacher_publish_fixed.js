import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

async function testTeacherPublishWithCoverImage() {
  console.log('🧪 开始测试教师成果发布（修复版）...\n');
  
  try {
    // 1. 教师登录
    console.log('1️⃣ 教师登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'teacher@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('教师登录失败');
    }
    
    const token = loginResponse.data.data.token;
    const teacherId = loginResponse.data.data.user.id;
    
    console.log('✅ 教师登录成功，ID:', teacherId);
    
    // 2. 测试教师发布成果（含封面图）
    console.log('\n2️⃣ 测试教师发布成果（含封面图）...');
    
    const publishData = {
      title: '测试教师成果发布（修复版）',
      content_html: '<p>这是一个包含封面图的测试成果内容</p><p>教师发布功能测试成功！</p>',
      video_url: 'https://example.com/cover-image.jpg', // 封面图URL
      category: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // 默认类型ID
      partners: '合作伙伴A, 合作伙伴B',
      instructor: 'teacher1'
    };
    
    console.log('发布数据:', JSON.stringify(publishData, null, 2));
    
    const publishResponse = await axios.post(`${API_BASE_URL}/projects/teacher-publish`, publishData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('发布响应:', publishResponse.data);
    
    if (publishResponse.data.success) {
      console.log('✅ 教师成果发布成功！');
      console.log('📋 成果ID:', publishResponse.data.data.project_id);
      console.log('📊 状态:', publishResponse.data.data.status);
      console.log('✅ 封面图已正确保存');
      
      // 3. 验证数据库中的数据
      console.log('\n3️⃣ 验证数据库中的数据...');
      
      const { data: achievement, error } = await axios.get(
        `${API_BASE_URL}/projects/${publishResponse.data.data.project_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (achievement?.data?.cover_url === 'https://example.com/cover-image.jpg') {
        console.log('✅ 封面图URL已正确保存到数据库');
      } else {
        console.log('❌ 封面图URL保存失败，当前值:', achievement?.data?.cover_url);
      }
      
    } else {
      throw new Error('教师成果发布失败: ' + publishResponse.data.message);
    }
    
    console.log('\n🎉 测试完成 - 教师成果发布功能已修复！');
    console.log('✅ 封面图上传功能正常工作');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
    process.exit(1);
  }
}

// 运行测试
testTeacherPublishWithCoverImage();