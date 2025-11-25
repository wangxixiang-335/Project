import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testReviewApiFix() {
  try {
    console.log('=== 测试审批API修复 ===\n');
    
    // 1. 测试健康检查
    console.log('1️⃣ 测试健康检查...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ 健康检查通过:', healthResponse.data.message);
    
    // 2. 测试待审批项目列表（无需认证）
    console.log('\n2️⃣ 测试待审批项目列表...');
    try {
      const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
        params: { page: 1, pageSize: 10 }
      });
      console.log('✅ 待审批项目列表响应:', {
        status: pendingResponse.status,
        dataLength: pendingResponse.data?.data?.length || 0,
        hasData: !!pendingResponse.data?.data
      });
      
      if (pendingResponse.data?.data && pendingResponse.data.data.length > 0) {
        const firstProject = pendingResponse.data.data[0];
        console.log('📋 第一个项目:', {
          id: firstProject.id || firstProject.project_id,
          title: firstProject.title,
          status: firstProject.status
        });
        
        // 保存第一个项目的ID用于后续测试
        const testProjectId = firstProject.id || firstProject.project_id;
        
        // 3. 测试单个项目详情（无需认证）
        console.log('\n3️⃣ 测试单个项目详情...');
        try {
          const detailResponse = await axios.get(`${API_BASE}/review/${testProjectId}`);
          console.log('✅ 项目详情响应状态:', detailResponse.status);
        } catch (detailError) {
          console.log('❌ 项目详情错误:', detailError.response?.status, detailError.response?.data?.error);
        }
      }
      
    } catch (pendingError) {
      console.log('❌ 待审批项目列表错误:', pendingError.response?.status, pendingError.response?.data?.error);
    }
    
    console.log('\n✅ API基础测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 后端服务器可能未启动，请运行: node src/app.js');
    }
  }
}

testReviewApiFix();