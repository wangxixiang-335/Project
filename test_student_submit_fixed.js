import axios from 'axios';
import { supabase } from './src/config/supabase.js';

const API_BASE_URL = 'http://localhost:3000/api';

async function testStudentSubmitWithCoverImage() {
  console.log('🧪 开始测试学生成果提交（修复版）...
');
  
  try {
    // 1. 学生登录
    console.log('1️⃣ 学生登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'student@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('学生登录失败');
    }
    
    const token = loginResponse.data.data.token;
    const studentId = loginResponse.data.data.user.id;
    
    console.log('✅ 学生登录成功，ID:', studentId);
    
    // 2. 测试学生提交成果（含封面图）
    console.log('
2️⃣ 测试学生提交成果（含封面图）...');
    
    const submitData = {
      title: '测试学生成果提交（含封面图）',
      content_html: '<p>这是一个包含封面图的测试成果内容</p><p>学生提交功能测试成功！</p>',
      video_url: 'https://example.com/cover-image.jpg', // 封面图URL
      category: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' // 默认类型ID
    };
    
    console.log('提交数据:', JSON.stringify(submitData, null, 2));
    
    const submitResponse = await axios.post(`${API_BASE_URL}/projects`, submitData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('提交响应:', submitResponse.data);
    
    if (submitResponse.data.success) {
      console.log('✅ 学生成果提交成功！');
      console.log('📋 成果ID:', submitResponse.data.data.id);
      
      // 3. 验证数据库中的数据
      console.log('
3️⃣ 验证数据库中的数据...');
      
      const { data: achievement, error } = await supabase
        .from('achievements')
        .select('id, title, cover_url, video_url, status')
        .eq('id', submitResponse.data.data.id)
        .single();

      if (error) {
        console.error('查询成果错误:', error);
        return;
      }
      
      console.log('数据库中的成果数据:');
      console.log(`   标题: ${achievement.title}`);
      console.log(`   cover_url: ${achievement.cover_url}`);
      console.log(`   video_url: ${achievement.video_url}`);
      console.log(`   状态: ${achievement.status}`);
      
      if (achievement.cover_url === 'https://example.com/cover-image.jpg') {
        console.log('✅ 封面图URL已正确保存到数据库');
      } else {
        console.log('❌ 封面图URL保存失败，当前值:', achievement.cover_url);
      }
      
    } else {
      throw new Error('学生成果提交失败: ' + submitResponse.data.message);
    }
    
    console.log('
🎉 测试完成 - 学生成果提交功能已修复！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
    process.exit(1);
  }
}

// 运行测试
testStudentSubmitWithCoverImage();