import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testExistingTeacherAuth() {
  console.log('🔍 测试现有教师认证...');
  
  // 测试已知的教师账号
  const teacherAccounts = [
    { email: 'teacher@example.com', password: 'password123' },
    { email: '3888952060@qq.com', password: 'Teacher123!' },
    { email: 'teacher@test.com', password: 'password123' }
  ];
  
  for (const account of teacherAccounts) {
    console.log(`\n🔑 测试账号: ${account.email}`);
    
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: account.email,
        password: account.password
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功');
        console.log('   用户角色:', loginResponse.data.data.role);
        console.log('   用户名:', loginResponse.data.data.username);
        
        if (loginResponse.data.data.role === 'teacher') {
          console.log('\n🎯 找到教师账号，开始测试评审功能...');
          
          // 测试获取待审核项目
          try {
            const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
              headers: { Authorization: `Bearer ${token}` },
              params: { page: 1, pageSize: 10 }
            });
            
            console.log('✅ 获取待审核项目成功');
            console.log('   总数:', pendingResponse.data.data.total);
            console.log('   项目列表:', pendingResponse.data.data.items);
            
            if (pendingResponse.data.data.items.length > 0) {
              const projectId = pendingResponse.data.data.items[0].project_id;
              console.log('\n🔧 测试评审操作，项目ID:', projectId);
              
              // 测试通过操作
              try {
                const approveResponse = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
                  audit_result: 1,
                  reject_reason: ''
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                console.log('✅ 通过操作成功:', approveResponse.data);
              } catch (approveError) {
                console.error('❌ 通过操作失败:');
                console.error('   状态码:', approveError.response?.status);
                console.error('   错误信息:', approveError.response?.data);
                console.error('   详细错误:', approveError.response?.data?.details);
                
                // 详细分析参数验证问题
                if (approveError.response?.data?.error === '参数验证失败') {
                  console.log('\n🔍 参数验证失败详细分析:');
                  console.log('   请求参数: { audit_result: 1, reject_reason: "" }');
                  console.log('   验证规则: audit_result 必须是 1 或 2，reject_reason 在 audit_result=2 时必填');
                  
                  // 检查是否是reject_reason的问题
                  if (approveError.response?.data?.details?.includes('reject_reason')) {
                    console.log('   🚨 问题可能是: reject_reason 不能为空字符串');
                    console.log('   🔧 建议修复: 传递 null 或 omit reject_reason');
                  }
                }
              }
              
              // 测试打回操作 (先重置状态)
              try {
                // 重置项目状态
                await axios.patch(`${API_BASE}/admin/achievements/${projectId}`, {
                  status: 1
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                const rejectResponse = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
                  audit_result: 2,
                  reject_reason: '项目内容需要完善'
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                console.log('✅ 打回操作成功:', rejectResponse.data);
              } catch (rejectError) {
                console.error('❌ 打回操作失败:', rejectError.response?.data);
              }
            }
          } catch (pendingError) {
            console.error('❌ 获取待审核项目失败:', pendingError.response?.data);
          }
          
          return; // 找到教师账号后退出
        }
      } else {
        console.log('❌ 登录失败:', loginResponse.data.error);
      }
    } catch (error) {
      console.log('❌ 登录异常:', error.response?.data || error.message);
    }
  }
  
  console.log('\n❌ 没有找到可用的教师账号');
  console.log('🔧 建议: 创建新的教师账号或检查现有账号的密码');
}

testExistingTeacherAuth();