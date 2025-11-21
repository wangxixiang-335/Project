// 诊断审核API问题
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function diagnoseAuditIssue() {
  console.log('🔍 开始诊断审核API问题...');
  
  try {
    // 1. 测试教师登录
    console.log('\n1. 测试教师登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher@example.com',
      password: 'teacher123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ 教师登录失败');
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ 教师登录成功');
    
    // 2. 获取待审核项目
    console.log('\n2. 获取待审核项目...');
    const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10 }
    });
    
    if (pendingResponse.data.success) {
      console.log('✅ 获取待审核项目成功');
      console.log('项目数量:', pendingResponse.data.data.items.length);
      
      if (pendingResponse.data.data.items.length > 0) {
        const project = pendingResponse.data.data.items[0];
        const projectId = project.project_id || project.id;
        console.log('第一个项目:', { projectId, title: project.title });
        
        // 3. 测试审核API（通过）
        console.log('\n3. 测试审核API（通过）...');
        try {
          const auditResponse = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
            audit_result: 1, // 通过
            reject_reason: null
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('✅ 审核API响应:', auditResponse.data);
        } catch (auditError) {
          console.log('❌ 审核API失败');
          console.log('错误状态码:', auditError.response?.status);
          console.log('错误详情:', auditError.response?.data);
          console.log('错误消息:', auditError.message);
        }
        
        // 4. 检查数据库中的项目状态
        console.log('\n4. 检查项目状态...');
        try {
          const projectDetail = await axios.get(`${API_BASE}/review/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (projectDetail.data.success) {
            console.log('项目当前状态:', projectDetail.data.data.status);
          }
        } catch (detailError) {
          console.log('获取项目详情失败:', detailError.message);
        }
      } else {
        console.log('⚠️ 没有待审核项目');
      }
    } else {
      console.log('❌ 获取待审核项目失败');
    }
    
  } catch (error) {
    console.error('诊断过程中出错:', error.message);
  }
}

// 运行诊断
diagnoseAuditIssue().catch(console.error);