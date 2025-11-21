import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testWithLogs() {
  console.log('=== 带详细日志的测试 ===\n');

  try {
    // 1. 注册新用户
    console.log('1. 注册新用户...');
    const userData = {
      email: `log_${Date.now()}@test.com`,
      password: 'test123456',
      username: `user_${Date.now()}`,
      role: 'student'
    };
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, userData);
    console.log('✅ 注册成功');

    // 2. 登录
    console.log('\n2. 用户登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: userData.email,
      password: userData.password
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');

    // 3. 提交项目 - 测试不同的数据组合
    const testCases = [
      {
        name: '只有标题',
        data: { title: '测试项目' }
      },
      {
        name: '标题+分类',
        data: { title: '测试项目', category: 'web' }
      },
      {
        name: '标题+内容',
        data: { title: '测试项目', content_html: '<p>测试内容</p>' }
      },
      {
        name: '标题+视频',
        data: { title: '测试项目', video_url: 'https://example.com/video.mp4' }
      },
      {
        name: '完整数据',
        data: { 
          title: '测试项目',
          content_html: '<p>测试内容</p>',
          video_url: '',
          category: 'web'
        }
      }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n3.${i+1} 测试: ${testCase.name}`);
      console.log('   提交数据:', JSON.stringify(testCase.data, null, 2));
      
      try {
        const response = await axios.post(`${API_BASE}/projects`, testCase.data, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('   ✅ 成功:', response.data);
      } catch (error) {
        console.log('   ❌ 失败:');
        if (error.response) {
          console.log('   状态码:', error.response.status);
          console.log('   错误信息:', JSON.stringify(error.response.data, null, 2));
        } else {
          console.log('   网络错误:', error.message);
        }
      }
    }

  } catch (error) {
    console.log('\n❌ 整体错误:');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('网络错误:', error.message);
    }
  }
}

testWithLogs();