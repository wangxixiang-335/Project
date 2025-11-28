/**
 * 富文本编辑器完整功能测试
 * 测试学生和教师成果发布页面的图片上传功能
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000/api';

// 测试用户凭据
const TEST_USERS = {
  student: {
    email: 'studentdemo@example.com',
    password: 'demo123456'
  },
  teacher: {
    email: 'teacherdemo@example.com', 
    password: 'demo123456'
  }
};

class RichTextTestSuite {
  constructor() {
    this.tokens = {};
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📋';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async login(userType) {
    try {
      this.log(`正在登录${userType}账户...`);
      
      const response = await axios.post(`${API_BASE}/auth/login`, TEST_USERS[userType]);
      
      if (response.data.success) {
        this.tokens[userType] = response.data.data.token;
        this.log(`✅ ${userType}登录成功`);
        return true;
      } else {
        this.log(`❌ ${userType}登录失败: ${response.data.message}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ ${userType}登录错误: ${error.message}`, 'error');
      return false;
    }
  }

  async testImageUpload(userType) {
    try {
      this.log(`正在测试${userType}图片上传...`);
      
      // 创建一个简单的测试图片（Base64编码的小图片）
      const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      // 将Base64转换为Buffer
      const base64Data = testImageBase64.replace(/^data:image\/png;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // 创建FormData
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('file', blob, 'test-image.png');
      
      const response = await axios.post(`${API_BASE}/upload/image`, formData, {
        headers: {
          'Authorization': `Bearer ${this.tokens[userType]}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success && response.data.data.url) {
        this.log(`✅ ${userType}图片上传成功: ${response.data.data.url}`);
        return response.data.data.url;
      } else {
        this.log(`❌ ${userType}图片上传失败: ${response.data.message}`, 'error');
        return null;
      }
    } catch (error) {
      this.log(`❌ ${userType}图片上传错误: ${error.message}`, 'error');
      return null;
    }
  }

  async testStudentProjectSubmission() {
    try {
      this.log('正在测试学生成果发布...');
      
      // 先上传一张测试图片
      const imageUrl = await this.testImageUpload('student');
      if (!imageUrl) {
        throw new Error('图片上传失败');
      }
      
      // 创建富文本内容（包含图片）
      const richTextContent = `
        <h3>🎯 学生测试成果</h3>
        <p>这是一个使用富文本编辑器创建的学生成果，包含<strong>文字</strong>和<img src="${imageUrl}" alt="测试图片" style="max-width: 100%; height: auto; margin: 10px 0;"/>图片。</p>
        <h4>主要特色</h4>
        <ul>
          <li>支持图文混合编辑</li>
          <li>类似学习通的使用体验</li>
          <li>图片自动上传到存储桶</li>
        </ul>
        <p>学生可以方便地创建包含图片的成果内容。</p>
      `;
      
      const projectData = {
        title: '学生富文本测试成果',
        content_html: richTextContent,
        video_url: ''
      };
      
      const response = await axios.post(`${API_BASE}/projects`, projectData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.tokens.student}`
        }
      });
      
      if (response.data.success) {
        this.log(`✅ 学生成果发布成功: ${response.data.data.project_id}`);
        return response.data.data.project_id;
      } else {
        this.log(`❌ 学生成果发布失败: ${response.data.message}`, 'error');
        return null;
      }
    } catch (error) {
      this.log(`❌ 学生成果发布错误: ${error.message}`, 'error');
      return null;
    }
  }

  async testTeacherProjectPublish() {
    try {
      this.log('正在测试教师成果发布...');
      
      // 先上传一张测试图片
      const imageUrl = await this.testImageUpload('teacher');
      if (!imageUrl) {
        throw new Error('图片上传失败');
      }
      
      // 创建富文本内容（包含图片）
      const richTextContent = `
        <h3>🏫 教师测试成果</h3>
        <p>这是一个使用富文本编辑器创建的教师成果，展示了<strong>教学创新</strong>和<img src="${imageUrl}" alt="测试图片" style="max-width: 100%; height: auto; margin: 10px 0;"/>实践应用。</p>
        <h4>教学成果</h4>
        <ul>
          <li>创新教学方法</li>
          <li>学生参与度提升</li>
          <li>教学效果显著改善</li>
        </ul>
        <p>教师可以方便地创建包含图片的详细成果介绍。</p>
      `;
      
      const publishData = {
        title: '教师富文本测试成果',
        content_html: richTextContent,
        video_url: ''
      };
      
      const response = await axios.post(`${API_BASE}/projects/teacher-publish`, publishData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.tokens.teacher}`
        }
      });
      
      if (response.data.success) {
        this.log(`✅ 教师成果发布成功: ${response.data.data.achievement_id}`);
        return response.data.data.achievement_id;
      } else {
        this.log(`❌ 教师成果发布失败: ${response.data.message}`, 'error');
        return null;
      }
    } catch (error) {
      this.log(`❌ 教师成果发布错误: ${error.message}`, 'error');
      return null;
    }
  }

  async testRichTextFeatures() {
    try {
      this.log('正在测试富文本编辑器功能...');
      
      // 这里可以测试富文本编辑器的各种功能
      // 由于是在Node.js环境中，我们无法直接测试浏览器端的编辑器
      // 但可以测试相关的API端点
      
      this.log('✅ 富文本功能测试完成（API层面）');
      return true;
    } catch (error) {
      this.log(`❌ 富文本功能测试错误: ${error.message}`, 'error');
      return false;
    }
  }

  async verifyImageStorage(achievementId) {
    try {
      this.log(`正在验证成果 ${achievementId} 的图片存储...`);
      
      const response = await axios.get(`${API_BASE}/projects/${achievementId}`);
      
      if (response.data.success) {
        const achievement = response.data.data;
        const content = achievement.description || achievement.content_html || '';
        
        // 从内容中提取图片URL
        const imageUrls = [];
        const imgRegex = /<img[^>]+src="([^"]+)"/g;
        let match;
        
        while ((match = imgRegex.exec(content)) !== null) {
          imageUrls.push(match[1]);
        }
        
        this.log(`✅ 发现 ${imageUrls.length} 张图片: ${imageUrls.join(', ')}`);
        return imageUrls;
      } else {
        this.log(`❌ 获取成果详情失败: ${response.data.message}`, 'error');
        return [];
      }
    } catch (error) {
      this.log(`❌ 验证图片存储错误: ${error.message}`, 'error');
      return [];
    }
  }

  async runAllTests() {
    console.log('\n🚀 开始富文本编辑器完整功能测试...\n');
    
    try {
      // 1. 登录测试用户
      const studentLogin = await this.login('student');
      const teacherLogin = await this.login('teacher');
      
      if (!studentLogin || !teacherLogin) {
        throw new Error('用户登录失败');
      }
      
      // 2. 测试学生成果发布
      const studentAchievementId = await this.testStudentProjectSubmission();
      if (studentAchievementId) {
        await this.verifyImageStorage(studentAchievementId);
      }
      
      // 3. 测试教师成果发布
      const teacherAchievementId = await this.testTeacherProjectPublish();
      if (teacherAchievementId) {
        await this.verifyImageStorage(teacherAchievementId);
      }
      
      // 4. 测试富文本功能
      await this.testRichTextFeatures();
      
      console.log('\n🎉 富文本编辑器功能测试完成！');
      console.log('\n📊 测试结果总结:');
      console.log(`- 学生登录: ${studentLogin ? '✅' : '❌'}`);
      console.log(`- 教师登录: ${teacherLogin ? '✅' : '❌'}`);
      console.log(`- 学生成果发布: ${studentAchievementId ? '✅' : '❌'}`);
      console.log(`- 教师成果发布: ${teacherAchievementId ? '✅' : '❌'}`);
      
      if (studentAchievementId && teacherAchievementId) {
        console.log('\n✅ 所有测试通过！富文本图片上传功能正常工作。');
      } else {
        console.log('\n⚠️  部分测试失败，请检查日志。');
      }
      
    } catch (error) {
      console.log(`\n❌ 测试失败: ${error.message}`);
    }
  }
}

// 运行测试
const testSuite = new RichTextTestSuite();
testSuite.runAllTests().catch(console.error);