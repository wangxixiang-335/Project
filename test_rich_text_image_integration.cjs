/**
 * 富文本图片上传功能集成测试
 * 测试学生和教师的成果发布框富文本编辑器图片上传功能
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';

// 测试用户凭证
const testUsers = {
  student: {
    email: 'student@test.com',
    password: '12345678'
  },
  teacher: {
    email: 'teacher@test.com',
    password: '12345678'
  }
};

class RichTextImageTest {
  constructor() {
    this.tokens = {};
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🚀 开始富文本图片上传功能集成测试...\n');
    
    try {
      // 1. 测试用户登录
      await this.testUserLogin();
      
      // 2. 测试学生端富文本图片上传
      await this.testStudentRichTextImageUpload();
      
      // 3. 测试教师端富文本图片上传
      await this.testTeacherRichTextImageUpload();
      
      // 4. 测试教师批改时的图片回显
      await this.testTeacherReviewImageDisplay();
      
      // 5. 生成测试报告
      await this.generateTestReport();
      
    } catch (error) {
      console.error('❌ 测试失败:', error.message);
      process.exit(1);
    }
  }

  async testUserLogin() {
    console.log('🔑 测试用户登录...');
    
    for (const [role, credentials] of Object.entries(testUsers)) {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, credentials);
        this.tokens[role] = response.data.token;
        console.log(`✅ ${role} 登录成功`);
        this.testResults.push({
          test: `${role}登录`,
          status: '通过',
          message: '登录成功'
        });
      } catch (error) {
        console.error(`❌ ${role} 登录失败:`, error.message);
        this.testResults.push({
          test: `${role}登录`,
          status: '失败',
          message: error.message
        });
      }
    }
  }

  async testStudentRichTextImageUpload() {
    console.log('\n📚 测试学生端富文本图片上传...');
    
    try {
      // 测试图片上传
      const imagePath = path.join(__dirname, 'uploads', 'images', 'test-image.jpg');
      
      // 如果测试图片不存在，创建一个简单的测试图片
      if (!fs.existsSync(imagePath)) {
        await this.createTestImage(imagePath);
      }
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));
      
      const response = await axios.post(`${API_BASE}/upload/image`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.tokens.student}`
        }
      });
      
      if (response.data.success && response.data.data.url) {
        console.log('✅ 学生端富文本图片上传成功');
        console.log(`📸 图片URL: ${response.data.data.url}`);
        console.log(`💾 存储方式: ${response.data.data.storage_type || 'unknown'}`);
        
        this.testResults.push({
          test: '学生端富文本图片上传',
          status: '通过',
          message: `图片上传成功: ${response.data.data.url}`
        });
        
        // 测试富文本内容创建
        await this.testStudentAchievementCreation(response.data.data.url);
        
      } else {
        throw new Error(response.data.message || '图片上传失败');
      }
      
    } catch (error) {
      console.error('❌ 学生端富文本图片上传失败:', error.message);
      this.testResults.push({
        test: '学生端富文本图片上传',
        status: '失败',
        message: error.message
      });
    }
  }

  async testTeacherRichTextImageUpload() {
    console.log('\n👨‍🏫 测试教师端富文本图片上传...');
    
    try {
      // 测试图片上传
      const imagePath = path.join(__dirname, 'uploads', 'images', 'test-image.jpg');
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));
      
      const response = await axios.post(`${API_BASE}/upload/image`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.tokens.teacher}`
        }
      });
      
      if (response.data.success && response.data.data.url) {
        console.log('✅ 教师端富文本图片上传成功');
        console.log(`📸 图片URL: ${response.data.data.url}`);
        console.log(`💾 存储方式: ${response.data.data.storage_type || 'unknown'}`);
        
        this.testResults.push({
          test: '教师端富文本图片上传',
          status: '通过',
          message: `图片上传成功: ${response.data.data.url}`
        });
        
        // 测试富文本内容创建
        await this.testTeacherAchievementCreation(response.data.data.url);
        
      } else {
        throw new Error(response.data.message || '图片上传失败');
      }
      
    } catch (error) {
      console.error('❌ 教师端富文本图片上传失败:', error.message);
      this.testResults.push({
        test: '教师端富文本图片上传',
        status: '失败',
        message: error.message
      });
    }
  }

  async testStudentAchievementCreation(imageUrl) {
    console.log('\n📝 测试学生成果创建（包含富文本图片）...');
    
    try {
      // 创建包含图片的富文本内容
      const richTextContent = `
        <h3>项目介绍</h3>
        <p>这是一个测试项目，包含富文本图片上传功能。</p>
        <img src="${imageUrl}" alt="测试图片" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />
        <p>图片已经成功上传到Supabase存储桶，并在富文本中正确显示。</p>
        <ul>
          <li>支持图片上传</li>
          <li>存储到Supabase存储桶</li>
          <li>在富文本中正确显示</li>
        </ul>
      `;
      
      const achievementData = {
        title: '学生富文本图片测试成果',
        content_html: richTextContent,
        video_url: '',
        category: 'web-development'
      };
      
      const response = await axios.post(`${API_BASE}/projects/submit`, achievementData, {
        headers: {
          'Authorization': `Bearer ${this.tokens.student}`
        }
      });
      
      if (response.data.success) {
        console.log('✅ 学生成果创建成功');
        this.testResults.push({
          test: '学生成果创建（富文本图片）',
          status: '通过',
          message: '成果创建成功'
        });
        return response.data.data.id;
      } else {
        throw new Error(response.data.message || '成果创建失败');
      }
      
    } catch (error) {
      console.error('❌ 学生成果创建失败:', error.message);
      this.testResults.push({
        test: '学生成果创建（富文本图片）',
        status: '失败',
        message: error.message
      });
    }
  }

  async testTeacherAchievementCreation(imageUrl) {
    console.log('\n📝 测试教师成果创建（包含富文本图片）...');
    
    try {
      // 创建包含图片的富文本内容
      const richTextContent = `
        <h3>教学项目介绍</h3>
        <p>这是一个教师测试项目，包含富文本图片上传功能。</p>
        <img src="${imageUrl}" alt="测试图片" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />
        <p>教师也可以上传图片到Supabase存储桶，并在富文本中正确显示。</p>
        <ol>
          <li>教师端图片上传</li>
          <li>存储到Supabase存储桶</li>
          <li>在富文本中正确显示</li>
        </ol>
      `;
      
      const achievementData = {
        title: '教师富文本图片测试成果',
        content_html: richTextContent,
        video_url: '',
        category: 'teaching-project'
      };
      
      const response = await axios.post(`${API_BASE}/projects/teacher-publish`, achievementData, {
        headers: {
          'Authorization': `Bearer ${this.tokens.teacher}`
        }
      });
      
      if (response.data.success) {
        console.log('✅ 教师成果创建成功');
        this.testResults.push({
          test: '教师成果创建（富文本图片）',
          status: '通过',
          message: '成果创建成功'
        });
        return response.data.data.id;
      } else {
        throw new Error(response.data.message || '成果创建失败');
      }
      
    } catch (error) {
      console.error('❌ 教师成果创建失败:', error.message);
      this.testResults.push({
        test: '教师成果创建（富文本图片）',
        status: '失败',
        message: error.message
      });
    }
  }

  async testTeacherReviewImageDisplay() {
    console.log('\n👁️ 测试教师批改时的图片回显...');
    
    try {
      // 获取待审核的成果列表
      const response = await axios.get(`${API_BASE}/review/pending`, {
        headers: {
          'Authorization': `Bearer ${this.tokens.teacher}`
        }
      });
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const achievement = response.data.data[0];
        console.log(`📋 找到待审核成果: ${achievement.title}`);
        
        // 获取成果详情
        const detailResponse = await axios.get(`${API_BASE}/review/${achievement.id}`, {
          headers: {
            'Authorization': `Bearer ${this.tokens.teacher}`
          }
        });
        
        if (detailResponse.data.success && detailResponse.data.data) {
          const detail = detailResponse.data.data;
          
          console.log('✅ 教师批改详情获取成功');
          console.log(`📄 内容长度: ${detail.content_html ? detail.content_html.length : 0} 字符`);
          
          // 检查是否包含图片
          const hasImages = detail.content_html && detail.content_html.includes('<img');
          if (hasImages) {
            console.log('🖼️ 富文本内容中包含图片');
            
            // 提取图片URL
            const imgMatches = detail.content_html.match(/<img[^>]+src="([^"]+)"/g);
            if (imgMatches) {
              imgMatches.forEach((match, index) => {
                const url = match.match(/src="([^"]+)"/)[1];
                console.log(`  📸 图片 ${index + 1}: ${url}`);
              });
            }
          }
          
          this.testResults.push({
            test: '教师批改图片回显',
            status: '通过',
            message: hasImages ? '成功显示富文本图片' : '内容正常显示（无图片）'
          });
        } else {
          throw new Error('获取成果详情失败');
        }
      } else {
        console.log('⚠️ 暂无待审核成果，跳过图片回显测试');
        this.testResults.push({
          test: '教师批改图片回显',
          status: '跳过',
          message: '暂无待审核成果'
        });
      }
      
    } catch (error) {
      console.error('❌ 教师批改图片回显测试失败:', error.message);
      this.testResults.push({
        test: '教师批改图片回显',
        status: '失败',
        message: error.message
      });
    }
  }

  async createTestImage(imagePath) {
    // 创建一个简单的测试图片（如果目录不存在则创建）
    const dir = path.dirname(imagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 创建一个1x1像素的红色PNG图片的base64数据
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync(imagePath, imageBuffer);
    console.log('🖼️ 创建测试图片:', imagePath);
  }

  async generateTestReport() {
    console.log('\n📊 生成测试报告...');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === '通过').length;
    const failedTests = this.testResults.filter(r => r.status === '失败').length;
    const skippedTests = this.testResults.filter(r => r.status === '跳过').length;
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 富文本图片上传功能测试报告');
    console.log('='.repeat(60));
    console.log(`📈 总计测试: ${totalTests}`);
    console.log(`✅ 通过: ${passedTests}`);
    console.log(`❌ 失败: ${failedTests}`);
    console.log(`⚠️  跳过: ${skippedTests}`);
    console.log(`📊 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    console.log('\n📋 详细测试结果:');
    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === '通过' ? '✅' : result.status === '失败' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${statusIcon} ${result.test}`);
      console.log(`   ${result.message}`);
      console.log('');
    });
    
    // 保存测试报告
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
        successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%'
      },
      results: this.testResults
    };
    
    const reportPath = path.join(__dirname, 'rich_text_image_test_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 测试报告已保存: ${reportPath}`);
    
    if (failedTests === 0) {
      console.log('\n🎉 所有测试通过！富文本图片上传功能正常工作。');
    } else {
      console.log(`\n⚠️  发现 ${failedTests} 个失败的测试，请检查相关问题。`);
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new RichTextImageTest();
  tester.runAllTests().catch(console.error);
}

module.exports = RichTextImageTest;