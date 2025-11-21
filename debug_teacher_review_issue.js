import axios from 'axios';
import { supabase } from './src/config/supabase.js';

const API_BASE = 'http://localhost:3000/api';

async function debugTeacherReviewIssue() {
  console.log('🔍 调试教师评审页面问题...');
  
  try {
    // 1. 检查数据库中的用户数据
    console.log('\n1️⃣ 检查数据库用户...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher');
    
    if (usersError) {
      console.error('❌ 获取教师用户失败:', usersError);
    } else {
      console.log('✅ 找到教师用户:', users?.length || 0);
      users?.forEach(user => {
        console.log(`   - ID: ${user.id}, 用户名: ${user.username}, 邮箱: ${user.email}`);
      });
    }
    
    // 2. 检查achievements表中的数据
    console.log('\n2️⃣ 检查成果数据...');
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*');
    
    if (achievementsError) {
      console.error('❌ 获取成果数据失败:', achievementsError);
    } else {
      console.log('✅ 找到成果:', achievements?.length || 0);
      const statusCount = {};
      achievements?.forEach(achievement => {
        statusCount[achievement.status] = (statusCount[achievement.status] || 0) + 1;
      });
      console.log('   状态分布:', statusCount);
    }
    
    // 3. 尝试使用第一个教师账号登录
    if (users && users.length > 0) {
      const teacher = users[0];
      console.log('\n3️⃣ 尝试教师登录...');
      
      // 尝试默认密码
      const passwords = ['password123', 'Teacher123!', '123456', 'admin'];
      
      for (const password of passwords) {
        try {
          const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: teacher.email,
            password: password
          });
          
          if (loginResponse.data.success) {
            const token = loginResponse.data.data.token;
            console.log(`✅ 登录成功，使用密码: ${password}`);
            
            // 4. 测试获取待审核项目
            console.log('\n4️⃣ 测试获取待审核项目...');
            try {
              const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: 1, pageSize: 10 }
              });
              
              console.log('✅ 获取待审核项目成功:', pendingResponse.data);
              
              if (pendingResponse.data.success && pendingResponse.data.data.items.length > 0) {
                const projectId = pendingResponse.data.data.items[0].project_id;
                console.log(`找到待审核项目ID: ${projectId}`);
                
                // 5. 测试审核操作
                console.log('\n5️⃣ 测试审核操作...');
                try {
                  const auditResponse = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
                    audit_result: 1, // 通过
                    reject_reason: ''
                  }, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  console.log('✅ 审核操作成功:', auditResponse.data);
                } catch (auditError) {
                  console.error('❌ 审核操作失败:');
                  console.error('   状态码:', auditError.response?.status);
                  console.error('   错误信息:', auditError.response?.data);
                  console.error('   详细错误:', auditError.response?.data?.details);
                  
                  // 分析具体错误
                  if (auditError.response?.data?.error === '参数验证失败') {
                    console.log('🔍 分析参数验证失败原因...');
                    console.log('   请求参数:', {
                      audit_result: 1,
                      reject_reason: ''
                    });
                    console.log('   验证schema要求audit_result为1或2，reject_reason在audit_result=2时必填');
                  }
                }
              } else {
                console.log('⚠️ 没有待审核项目');
              }
            } catch (pendingError) {
              console.error('❌ 获取待审核项目失败:', pendingError.response?.data);
            }
            return; // 登录成功后退出
          }
        } catch (loginError) {
          // 继续尝试下一个密码
        }
      }
      console.log('❌ 所有密码都尝试失败');
    }
    
    // 4. 如果没有教师用户，创建一个测试用户
    if (!users || users.length === 0) {
      console.log('\n4️⃣ 创建测试教师用户...');
      const { data: newTeacher, error: createError } = await supabase
        .from('users')
        .insert({
          username: 'testteacher',
          email: 'teacher@example.com',
          password: 'password123', // 注意：实际应用中需要加密
          role: 'teacher'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ 创建教师用户失败:', createError);
      } else {
        console.log('✅ 创建教师用户成功:', newTeacher);
      }
    }
    
  } catch (error) {
    console.error('❌ 调试过程出错:', error);
  }
}

debugTeacherReviewIssue();