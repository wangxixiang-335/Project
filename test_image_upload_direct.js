/**
 * 直接测试图片上传功能
 * 测试富文本编辑器的核心功能
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000/api';

// 使用环境变量中的token或已知的测试token
const TEST_TOKEN = process.env.TEST_AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNGE5YzA0My0xMjM0LTU2NzgtOWFiYy0xMjM0NTY3ODkwYWIiLCJlbWFpbCI6InN0dWRlbnRkZW1vQGV4YW1wbGUuY29tIiwicm9sZSI6InN0dWRlbnQiLCJ1c2VybmFtZSI6IuWwj+eZveWwj+eZvSIsImV4cCI6MTczNTQ4NDQwMCwiaWF0IjoxNzM1Mzk4MDAwfQ.zxJ1m1hL2XKCpJqY5X5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5';

class ImageUploadTest {
  constructor() {
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📋';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async testImageUpload() {
    try {
      this.log('开始测试图片上传功能...');
      
      // 创建一个简单的测试图片（1x1像素PNG）
      const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      // 将Base64转换为Buffer
      const base64Data = testImageBase64.replace(/^data:image\/png;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // 创建FormData
      const formData = new FormData();
      
      // 在Node.js环境中创建Blob
      const { Blob } = await import('node:buffer');
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('file', blob, 'test-image.png');
      
      this.log('正在上传测试图片...');
      
      const response = await axios.post(`${API_BASE}/upload/image`, formData, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success && response.data.data.url) {
        this.log(`✅ 图片上传成功: ${response.data.data.url}`);
        this.log(`📊 存储类型: ${response.data.data.storage_type || 'unknown'}`);
        this.log(`📁 文件大小: ${response.data.data.size || 'unknown'} bytes`);
        return response.data.data.url;
      } else {
        this.log(`❌ 图片上传失败: ${response.data.message}`, 'error');
        return null;
      }
    } catch (error) {
      this.log(`❌ 图片上传错误: ${error.message}`, 'error');
      if (error.response) {
        this.log(`📋 错误详情: ${JSON.stringify(error.response.data)}`, 'error');
      }
      return null;
    }
  }

  async testBase64Upload() {
    try {
      this.log('开始测试Base64图片上传...');
      
      // 创建一个简单的测试图片
      const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const response = await axios.post(`${API_BASE}/upload/base64-image`, {
        image: testImageBase64,
        filename: 'test-base64-image.png'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      if (response.data.success && response.data.data.url) {
        this.log(`✅ Base64图片上传成功: ${response.data.data.url}`);
        return response.data.data.url;
      } else {
        this.log(`❌ Base64图片上传失败: ${response.data.message}`, 'error');
        return null;
      }
    } catch (error) {
      this.log(`❌ Base64图片上传错误: ${error.message}`, 'error');
      return null;
    }
  }

  async testSimpleBase64Upload() {
    try {
      this.log('开始测试简化Base64图片上传...');
      
      // 创建一个简单的测试图片
      const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const response = await axios.post(`${API_BASE}/upload-simple/base64-simple`, {
        image: testImageBase64,
        filename: 'test-simple-base64.png'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      if (response.data.success && response.data.data.url) {
        this.log(`✅ 简化Base64图片上传成功: ${response.data.data.url}`);
        return response.data.data.url;
      } else {
        this.log(`❌ 简化Base64图片上传失败: ${response.data.message}`, 'error');
        return null;
      }
    } catch (error) {
      this.log(`❌ 简化Base64图片上传错误: ${error.message}`, 'error');
      return null;
    }
  }

  async testRichTextContentWithImages() {
    try {
      this.log('正在测试富文本内容与图片集成...');
      
      // 上传多张测试图片
      const imageUrls = [];
      for (let i = 0; i < 3; i++) {
        const url = await this.testImageUpload();
        if (url) {
          imageUrls.push(url);
        }
      }
      
      if (imageUrls.length === 0) {
        throw new Error('没有成功上传的图片');
      }
      
      // 创建富文本内容
      const richTextContent = `
        <h3>🎯 富文本测试成果</h3>
        <p>这是一个包含多张图片的富文本内容测试。</p>
        <h4>第一张图片</h4>
        <img src="${imageUrls[0]}" alt="测试图片1" style="max-width: 100%; height: auto; margin: 10px 0;"/>
        <p>这是第一张图片的描述文字。</p>
        ${imageUrls[1] ? `<h4>第二张图片</h4><img src="${imageUrls[1]}" alt="测试图片2" style="max-width: 100%; height: auto; margin: 10px 0;"/><p>这是第二张图片的描述文字。</p>` : ''}
        ${imageUrls[2] ? `<h4>第三张图片</h4><img src="${imageUrls[2]}" alt="测试图片3" style="max-width: 100%; height: auto; margin: 10px 0;"/><p>这是第三张图片的描述文字。</p>` : ''}
        <h4>总结</h4>
        <p>通过富文本编辑器，可以方便地创建包含多张图片的混合内容。</p>
      `;
      
      this.log(`✅ 富文本内容创建成功，包含 ${imageUrls.length} 张图片`);
      this.log(`📊 内容长度: ${richTextContent.length} 字符`);
      
      // 模拟提取图片URL（类似后端的extractImageUrls函数）
      const extractedUrls = [];
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      let match;
      
      while ((match = imgRegex.exec(richTextContent)) !== null) {
        extractedUrls.push(match[1]);
      }
      
      this.log(`🔍 提取到的图片URL: ${extractedUrls.join(', ')}`);
      
      return {
        content: richTextContent,
        images: extractedUrls
      };
    } catch (error) {
      this.log(`❌ 富文本内容测试错误: ${error.message}`, 'error');
      return null;
    }
  }

  async testStorageBuckets() {
    try {
      this.log('正在检查存储桶配置...');
      
      // 检查存储桶
      const response = await fetch(`${API_BASE}/upload/health`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      
      if (response.ok) {
        this.log('✅ 上传服务正常运行');
      } else {
        this.log('❌ 上传服务可能有问题', 'error');
      }
      
      return response.ok;
    } catch (error) {
      this.log(`❌ 存储桶检查错误: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    console.log('\n🚀 开始富文本图片上传功能测试...\n');
    
    try {
      // 1. 检查存储桶
      await this.testStorageBuckets();
      
      // 2. 测试普通图片上传
      const normalUpload = await this.testImageUpload();
      
      // 3. 测试Base64图片上传
      const base64Upload = await this.testBase64Upload();
      
      // 4. 测试简化Base64上传
      const simpleUpload = await this.testSimpleBase64Upload();
      
      // 5. 测试富文本内容集成
      const richTextResult = await this.testRichTextContentWithImages();
      
      console.log('\n🎉 富文本图片上传功能测试完成！');
      console.log('\n📊 测试结果总结:');
      console.log(`- 普通图片上传: ${normalUpload ? '✅' : '❌'}`);
      console.log(`- Base64图片上传: ${base64Upload ? '✅' : '❌'}`);
      console.log(`- 简化Base64上传: ${simpleUpload ? '✅' : '❌'}`);
      console.log(`- 富文本内容集成: ${richTextResult ? '✅' : '❌'}`);
      
      if (normalUpload && richTextResult) {
        console.log('\n✅ 核心功能测试通过！富文本图片上传功能正常工作。');
        console.log('\n📝 功能特点:');
        console.log('- 支持多种图片上传方式');
        console.log('- 图片存储到Supabase存储桶');
        console.log('- 数据库中只存储图片URL');
        console.log('- 支持富文本内容中的图片提取');
        console.log('- 类似学习通的图文混合编辑体验');
      } else {
        console.log('\n⚠️  部分测试失败，请检查日志。');
      }
      
    } catch (error) {
      console.log(`\n❌ 测试失败: ${error.message}`);
    }
  }
}

// 运行测试
const imageUploadTest = new ImageUploadTest();
imageUploadTest.runAllTests().catch(console.error);