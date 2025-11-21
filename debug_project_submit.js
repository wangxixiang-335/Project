import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function debugProjectSubmit() {
  console.log('=== 调试学生项目提交问题 ===\n');

  try {
    // 1. 学生登录
    console.log('1. 学生登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test1763088741241@example.com',
      password: 'test123456'
    });

    if (!loginResponse.data.success) {
      console.log('❌ 登录失败:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');

    // 2. 测试不同的提交数据组合
    const testCases = [
      {
        name: '基础提交（只有标题）',
        data: { title: '测试项目' }
      },
      {
        name: '完整提交（标题+内容+视频+category）',
        data: { 
          title: '测试项目',
          content_html: '<p>测试内容</p>',
          video_url: 'https://example.com/video.mp4',
          category: 'web'
        }
      },
      {
        name: '图文提交（标题+HTML内容）',
        data: { 
          title: '测试项目',
          content_html: '<p>测试内容<img src="https://example.com/image.jpg"/></p>'
        }
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n3.${i+1} ${testCase.name}...`);
      
      try {
        const response = await axios.post(`${API_BASE}/projects`, testCase.data, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          console.log('✅ 提交成功:', response.data);
        } else {
          console.log('❌ 提交失败:', response.data);
        }
      } catch (error) {
        console.log('❌ 请求错误:');
        if (error.response) {
          console.log('   状态码:', error.response.status);
          console.log('   错误信息:', error.response.data);
        } else {
          console.log('   网络错误:', error.message);
        }
      }
    }

  } catch (error) {
    console.log('❌ 整体错误:');
    console.log(error.message);
  }
}

// 运行调试
debugProjectSubmit();