const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testStudentProjectSubmission() {
  console.log('=== 测试学生项目提交功能 ===\n');

  // 1. 学生登录
  console.log('1. 学生登录...');
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'student@example.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 学生登录成功');
      console.log('用户信息:', loginResponse.data.data);

      // 2. 提交项目
      console.log('\n2. 测试项目提交...');
      const projectData = {
        title: '测试项目标题',
        content_html: '<p>这是一个测试项目的内容</p>',
        video_url: ''
      };

      const submitResponse = await axios.post(`${API_BASE}/projects`, projectData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (submitResponse.data.success) {
        console.log('✅ 项目提交成功');
        console.log('项目ID:', submitResponse.data.data.project_id);
        console.log('项目状态:', submitResponse.data.data.status);
      } else {
        console.log('❌ 项目提交失败:', submitResponse.data.error);
      }

      // 3. 获取项目列表
      console.log('\n3. 获取项目列表...');
      const projectsResponse = await axios.get(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 10 }
      });

      if (projectsResponse.data.success) {
        console.log('✅ 获取项目列表成功');
        console.log('项目数量:', projectsResponse.data.data.total || projectsResponse.data.data.items?.length || 0);
        console.log('项目列表:', projectsResponse.data.data.items || projectsResponse.data.data);
      } else {
        console.log('❌ 获取项目列表失败:', projectsResponse.data.error);
      }

    } else {
      console.log('❌ 学生登录失败:', loginResponse.data.error);
    }
  } catch (error) {
    console.log('❌ 测试过程中出错:');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误信息:', error.response.data);
    } else {
      console.log('错误:', error.message);
    }
  }
}

// 运行测试
if (require.main === module) {
  testStudentProjectSubmission();
}

module.exports = { testStudentProjectSubmission };