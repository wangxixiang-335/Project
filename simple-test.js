// 简单的后端API测试脚本
const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🔍 开始测试后端API...\n');
  
  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查接口:');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅', healthData);
    
    // 2. 测试公开项目列表
    console.log('\n2. 测试公开项目列表接口:');
    const projectsResponse = await fetch(`${BASE_URL}/api/stats/projects/public`);
    const projectsData = await projectsResponse.json();
    console.log('✅', projectsData);
    
    // 3. 测试统计信息
    console.log('\n3. 测试统计信息接口:');
    const statsResponse = await fetch(`${BASE_URL}/api/stats`);
    const statsData = await statsResponse.json();
    console.log('✅', statsData);
    
    console.log('\n🎉 API测试完成！所有接口运行正常！');
    
  } catch (error) {
    console.log('❌ API测试失败:', error.message);
  }
}

// 运行测试
testAPI();