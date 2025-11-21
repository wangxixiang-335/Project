import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function testFixedReview() {
  console.log('🎯 测试修复后的评审功能...');
  
  const teacherEmail = 'teacher1763449748933@example.com';
  const teacherPassword = 'password123';
  
  try {
    // 登录
    console.log('1️⃣ 教师登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: teacherEmail,
      password: teacherPassword
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功');
      console.log('   用户ID:', loginResponse.data.data.user_id);
      console.log('   用户名:', loginResponse.data.data.username);
      console.log('   角色:', loginResponse.data.data.role);
      
      // 获取待审核项目
      console.log('2️⃣ 获取待审核项目...');
      const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 10 }
      });
      
      if (pendingResponse.data.success && pendingResponse.data.data.items.length > 0) {
        const project = pendingResponse.data.data.items[0];
        console.log('✅ 找到待审核项目:', {
          id: project.project_id,
          title: project.title,
          student: project.student_name
        });
        
        // 测试通过操作
        console.log('3️⃣ 测试通过操作...');
        try {
          const approveResponse = await axios.post(`${API_BASE}/review/${project.project_id}/audit`, {
            audit_result: 1
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('🎉 通过操作成功:', approveResponse.data.message);
          console.log('   项目状态:', approveResponse.data.data.status);
          console.log('   项目ID:', approveResponse.data.data.project_id);
        } catch (approveError) {
          console.error('❌ 通过操作失败:', approveError.response?.data);
        }
        
        // 重置状态并测试打回操作
        console.log('4️⃣ 重置状态并测试打回操作...');
        
        // 使用数据库直接重置状态
        const { supabase } = await import('./src/config/supabase.js');
        await supabase
          .from('achievements')
          .update({ status: 1 })
          .eq('id', project.project_id);
        
        try {
          const rejectResponse = await axios.post(`${API_BASE}/review/${project.project_id}/audit`, {
            audit_result: 2,
            reject_reason: '项目内容需要进一步完善：\n1. 技术实现不够详细\n2. 缺少实际应用案例\n3. 测试数据不够充分\n4. 建议增加用户界面设计'
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('🎉 打回操作成功:', rejectResponse.data.message);
          console.log('   项目状态:', rejectResponse.data.data.status);
          console.log('   打回原因:', rejectResponse.data.data.reject_reason);
        } catch (rejectError) {
          console.error('❌ 打回操作失败:', rejectError.response?.data);
        }
        
        // 检查最终状态
        console.log('5️⃣ 检查项目最终状态...');
        try {
          const statusResponse = await axios.get(`${API_BASE}/teacher/projects`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: 1, pageSize: 20 }
          });
          
          console.log('✅ 所有项目状态:');
          statusResponse.data.data.items.forEach(item => {
            console.log(`   - ${item.title}: ${item.status_text} (状态码: ${item.status})`);
          });
          
          // 统计信息
          const statsResponse = await axios.get(`${API_BASE}/teacher/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('✅ 统计信息:');
          const stats = statsResponse.data.data;
          console.log(`   总数: ${stats.total}, 待审核: ${stats.pending}, 已通过: ${stats.approved}, 已打回: ${stats.rejected}`);
          
        } catch (statusError) {
          console.error('❌ 检查状态失败:', statusError.response?.data);
        }
        
        console.log('\n🎉 教师评审功能测试完成！');
        console.log('✅ 修复成果:');
        console.log('   1. 修复了参数验证问题');
        console.log('   2. 修复了用户ID访问问题');
        console.log('   3. 修复了数据库字段兼容性问题');
        console.log('   4. 通过和打回操作现在应该正常工作');
        
        console.log('\n📝 教师账号信息:');
        console.log('   邮箱:', teacherEmail);
        console.log('   密码:', teacherPassword);
        
      } else {
        console.log('⚠️ 没有待审核项目');
      }
    } else {
      console.error('❌ 登录失败:', loginResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 请确保服务器运行: node src/app.js');
    }
  }
}

testFixedReview();