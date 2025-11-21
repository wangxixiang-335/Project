// 测试教师认证修复
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testTeacherAuthFix() {
  console.log('🧪 开始测试教师认证修复...\n');

  try {
    // 1. 测试教师登录
    console.log('1️⃣ 测试教师登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher@example.com',
      password: 'demo123456'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      const userData = loginResponse.data.data;
      console.log('✅ 教师登录成功');
      console.log('👤 用户信息:', {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        username: userData.username
      });
      console.log('🔑 Token预览:', token.substring(0, 20) + '...');

      // 2. 检查token存储
      console.log('\n2️⃣ 检查token存储键...');
      console.log('📍 应该存储为: teacherToken (教师专用)');
      console.log('📍 同时设置: token (通用兼容)');

      // 3. 测试认证验证
      console.log('\n3️⃣ 测试认证验证...');
      const authResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (authResponse.data.success) {
        console.log('✅ 认证验证成功');
        console.log('👤 当前用户:', authResponse.data.data);
      } else {
        console.log('❌ 认证验证失败');
      }

      // 4. 测试教师端点访问
      console.log('\n4️⃣ 测试教师端点访问...');
      
      // 测试成果管理端点
      try {
        const manageResponse = await axios.get(`${API_BASE}/teacher/my-projects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ 成果管理端点访问成功');
        console.log('📊 项目数量:', manageResponse.data.data?.length || 0);
      } catch (error) {
        console.log('❌ 成果管理端点访问失败:', error.message);
      }

      // 测试成果库端点
      try {
        const libraryResponse = await axios.get(`${API_BASE}/teacher/library`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ 成果库端点访问成功');
        console.log('📚 成果数量:', libraryResponse.data.data?.length || 0);
      } catch (error) {
        console.log('❌ 成果库端点访问失败:', error.message);
      }

      console.log('\n🎉 教师认证修复测试完成！');
      
    } else {
      console.log('❌ 教师登录失败:', loginResponse.data.error);
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('📋 错误详情:', {
        status: error.response.status,
        data: error.response.data,
        message: error.response.data?.error || error.response.data?.message
      });
    }
  }
}

// 运行测试
if (require.main === module) {
  testTeacherAuthFix();
}

module.exports = { testTeacherAuthFix };