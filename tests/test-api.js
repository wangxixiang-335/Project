// 后端API测试脚本
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🔍 开始测试后端API...\n');
  
  // 1. 测试健康检查
  console.log('1. 测试健康检查接口:');
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅', healthData);
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
  }
  
  // 2. 测试用户注册
  console.log('\n2. 测试用户注册接口:');
  try {
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        username: '测试用户',
        role: 'student'
      })
    });
    const registerData = await registerResponse.json();
    console.log('✅', registerData);
  } catch (error) {
    console.log('❌ 注册失败:', error.message);
  }
  
  // 3. 测试用户登录
  console.log('\n3. 测试用户登录接口:');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'student@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅', loginData);
    
    if (loginData.success) {
      const token = loginData.data.token;
      
      // 4. 测试获取用户信息
      console.log('\n4. 测试获取用户信息:');
      const userResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const userData = await userResponse.json();
      console.log('✅', userData);
      
      // 5. 测试获取项目列表
      console.log('\n5. 测试获取项目列表:');
      const projectsResponse = await fetch(`${BASE_URL}/api/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const projectsData = await projectsResponse.json();
      console.log('✅', projectsData);
      
      // 6. 测试统计信息
      console.log('\n6. 测试统计信息接口:');
      const statsResponse = await fetch(`${BASE_URL}/api/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const statsData = await statsResponse.json();
      console.log('✅', statsData);
    }
    
  } catch (error) {
    console.log('❌ 登录失败:', error.message);
  }
  
  console.log('\n🎉 API测试完成！');
}

testAPI().catch(console.error);