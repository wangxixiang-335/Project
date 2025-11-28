import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
const TEST_TOKEN = 'dev-teacher-token';

async function testUserAPIs() {
  console.log('🧪 开始测试用户相关API...\n');

  try {
    // 1. 测试获取当前用户信息
    console.log('📋 测试1: 获取当前用户信息');
    try {
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log('✅ 获取当前用户信息成功:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('❌ 获取当前用户信息失败:', error.response?.data || error.message);
    }

    // 2. 测试获取教师列表
    console.log('\n👨‍🏫 测试2: 获取教师列表');
    try {
      const response = await axios.get(`${API_BASE}/teacher/instructors`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log('✅ 获取教师列表成功:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('❌ 获取教师列表失败:', error.response?.data || error.message);
    }

    // 3. 测试获取学生成果（教师权限）
    console.log('\n📚 测试3: 获取学生成果列表');
    try {
      const response = await axios.get(`${API_BASE}/teacher/student-achievements`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log('✅ 获取学生成果成功，数量:', response.data.data?.length || 0);
      if (response.data.data && response.data.data.length > 0) {
        console.log('前3个成果:', JSON.stringify(response.data.data.slice(0, 3), null, 2));
      }
    } catch (error) {
      console.error('❌ 获取学生成果失败:', error.response?.data || error.message);
    }

    // 4. 测试获取教师个人成果
    console.log('\n📝 测试4: 获取教师个人成果');
    try {
      const response = await axios.get(`${API_BASE}/teacher/my-projects`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log('✅ 获取教师个人成果成功，数量:', response.data.data?.length || 0);
      if (response.data.data && response.data.data.length > 0) {
        console.log('前3个成果:', JSON.stringify(response.data.data.slice(0, 3), null, 2));
      }
    } catch (error) {
      console.error('❌ 获取教师个人成果失败:', error.response?.data || error.message);
    }

    // 5. 测试学生token
    console.log('\n🎓 测试5: 使用学生token测试');
    const STUDENT_TOKEN = 'dev-student-token';
    try {
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${STUDENT_TOKEN}`
        }
      });
      console.log('✅ 学生用户信息:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('❌ 获取学生用户信息失败:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ 测试过程出错:', error.message);
  }
}

// 运行测试
testUserAPIs().then(() => {
  console.log('\n🎯 API测试完成');
  process.exit(0);
}).catch(err => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});