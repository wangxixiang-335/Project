import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testFixedReview() {
  console.log('🔧 测试修复后的评审功能...');
  
  // 使用之前创建的教师账号
  const teacherEmail = 'teacher1763449748933@example.com';
  const teacherPassword = 'password123';
  
  try {
    // 1. 登录
    console.log('1️⃣ 教师登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: teacherEmail,
      password: teacherPassword
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功');
      
      // 2. 获取待审核项目
      console.log('2️⃣ 获取待审核项目...');
      const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 10 }
      });
      
      console.log('✅ 获取待审核项目成功');
      console.log('   总数:', pendingResponse.data.data.total);
      console.log('   项目数:', pendingResponse.data.data.items.length);
      
      if (pendingResponse.data.data.items.length > 0) {
        const project = pendingResponse.data.data.items[0];
        console.log('   项目信息:', {
          id: project.project_id,
          title: project.title,
          student: project.student_name
        });
        
        // 3. 测试通过操作
        console.log('3️⃣ 测试通过操作...');
        try {
          const approveResponse = await axios.post(`${API_BASE}/review/${project.project_id}/audit`, {
            audit_result: 1
            // 不传递reject_reason，让它使用默认值
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('✅ 通过操作成功:', approveResponse.data.message);
        } catch (approveError) {
          console.error('❌ 通过操作失败:');
          console.error('   状态码:', approveError.response?.status);
          console.error('   错误信息:', approveError.response?.data);
          console.error('   详细错误:', approveError.response?.data?.details);
          
          if (approveError.response?.data?.error === '参数验证失败') {
            console.log('🔍 参数验证仍然失败，尝试其他方案...');
            
            // 尝试传递null
            try {
              const response2 = await axios.post(`${API_BASE}/review/${project.project_id}/audit`, {
                audit_result: 1,
                reject_reason: null
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              console.log('✅ 通过操作成功(reject_reason=null):', response2.data.message);
            } catch (error2) {
              console.error('❌ 仍然失败:', error2.response?.data);
            }
          }
        }
        
        // 4. 测试打回操作
        console.log('4️⃣ 测试打回操作...');
        
        // 先重置项目状态
        await axios.patch(`${API_BASE}/admin/achievements/${project.project_id}/status`, {
          status: 1
        }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {}); // 忽略错误，可能没有这个接口
        
        try {
          const rejectResponse = await axios.post(`${API_BASE}/review/${project.project_id}/audit`, {
            audit_result: 2,
            reject_reason: '项目内容需要进一步完善，请补充更多技术细节和实际应用案例。'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('✅ 打回操作成功:', rejectResponse.data.message);
        } catch (rejectError) {
          console.error('❌ 打回操作失败:');
          console.error('   状态码:', rejectError.response?.status);
          console.error('   错误信息:', rejectError.response?.data);
          console.error('   详细错误:', rejectError.response?.data?.details);
        }
        
        // 5. 检查项目状态更新
        console.log('5️⃣ 检查项目状态更新...');
        try {
          const checkResponse = await axios.get(`${API_BASE}/teacher/projects`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: 1, pageSize: 10 }
          });
          
          console.log('✅ 获取所有项目成功');
          console.log('   项目状态:');
          checkResponse.data.data.items.forEach(item => {
            console.log(`   - ${item.title}: ${item.status_text} (${item.status})`);
          });
        } catch (checkError) {
          console.error('❌ 获取项目状态失败:', checkError.response?.data);
        }
        
      } else {
        console.log('⚠️ 没有待审核项目');
      }
      
    } else {
      console.error('❌ 登录失败:', loginResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 服务器可能未启动，请先运行: node src/app.js');
    }
  }
}

testFixedReview();