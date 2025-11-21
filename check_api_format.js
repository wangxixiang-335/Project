import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 检查API格式（不依赖登录）
async function checkAPIFormat() {
  console.log('🔍 检查API数据格式...\n');
  
  try {
    // 1. 检查可用的端点
    console.log('📋 1. 检查可用端点...');
    await checkAvailableEndpoints();
    
    // 2. 尝试获取一些公共数据
    console.log('\n📋 2. 尝试获取公共数据...');
    await checkPublicData();
    
    // 3. 提供测试建议
    console.log('\n💡 3. 测试建议:');
    provideTestSuggestions();
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

// 检查可用端点
async function checkAvailableEndpoints() {
  const endpoints = [
    '/health',
    '/auth/login',
    '/teacher/my-projects',
    '/teacher/library',
    '/teacher/student-achievements'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_BASE}${endpoint}`, {
        validateStatus: (status) => true,
        timeout: 5000
      });
      
      if (response.status === 404) {
        console.log(`❌ ${endpoint} - 不存在`);
      } else if (response.status === 401) {
        console.log(`✅ ${endpoint} - 存在（需要认证）`);
      } else if (response.status === 200) {
        console.log(`✅ ${endpoint} - 存在（公开访问）`);
      } else {
        console.log(`⚠️ ${endpoint} - 状态:${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${endpoint} - 连接被拒绝（服务未启动）`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`⏰ ${endpoint} - 请求超时`);
      } else {
        console.log(`❌ ${endpoint} - 错误:`, error.message);
      }
    }
  }
}

// 检查公共数据
async function checkPublicData() {
  try {
    // 尝试获取健康检查端点
    const healthResponse = await axios.get(`${API_BASE}/health`, {
      validateStatus: (status) => true
    });
    
    if (healthResponse.status === 200) {
      console.log('✅ 健康检查端点正常:', healthResponse.data);
    } else {
      console.log('⚠️ 健康检查端点返回:', healthResponse.status);
    }
    
  } catch (error) {
    console.log('❌ 无法获取公共数据:', error.message);
  }
}

// 提供测试建议
function provideTestSuggestions() {
  console.log('基于之前的分析，建议按以下步骤测试:');
  console.log('');
  console.log('1. 🔑 登录测试:');
  console.log('   - 后端要求邮箱格式，但数据库中只有用户名');
  console.log('   - 需要检查用户注册时是否保存了邮箱');
  console.log('   - 或者修改后端允许用户名登录');
  console.log('');
  console.log('2. 📊 数据格式验证:');
  console.log('   - 教师个人成果: /teacher/my-projects');
  console.log('   - 学生成果查看: /teacher/student-achievements');
  console.log('   - 需要验证返回字段是否匹配前端期望');
  console.log('');
  console.log('3. 🔧 修复建议:');
  console.log('   - 确保后端返回的数据包含所有必需字段');
  console.log('   - 状态码映射要前后端一致');
  console.log('   - 关联数据（类型、班级等）要完整');
}

// 运行检查
checkAPIFormat().catch(console.error);