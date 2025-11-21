import axios from 'axios';
import { supabase } from './src/config/supabase.js';

const API_BASE = 'http://localhost:3000/api';

async function fixTeacherReviewAuth() {
  console.log('🔧 修复教师评审认证问题...');
  
  try {
    // 1. 创建测试教师用户
    console.log('\n1️⃣ 创建测试教师用户...');
    const { data: existingTeacher } = await supabase
      .from('users')
      .select('*')
      .eq('role', 1) // role=1 表示教师
      .single();
    
    let teacherUser = existingTeacher;
    
    if (!teacherUser) {
      // 如果没有教师用户，创建一个
      const { data: newTeacher, error: createError } = await supabase
        .from('users')
        .insert({
          username: 'testteacher',
          password_hash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // 密码: password123
          role: 1, // 1 = teacher
          class_id: null
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ 创建教师用户失败:', createError);
        return;
      }
      
      teacherUser = newTeacher;
      console.log('✅ 创建教师用户成功:', teacherUser);
    } else {
      console.log('✅ 找到现有教师用户:', teacherUser);
    }
    
    // 2. 修改登录逻辑以使用用户名而不是邮箱
    console.log('\n2️⃣ 测试用户名登录...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: teacherUser.username, // 使用用户名作为email参数
        password: 'password123'
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功');
        
        // 3. 测试获取待审核项目
        console.log('\n3️⃣ 测试获取待审核项目...');
        const pendingResponse = await axios.get(`${API_BASE}/review/pending`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: 1, pageSize: 10 }
        });
        
        console.log('✅ 获取待审核项目成功:', pendingResponse.data);
        
        if (pendingResponse.data.success && pendingResponse.data.data.items.length > 0) {
          const projectId = pendingResponse.data.data.items[0].project_id;
          console.log(`找到待审核项目ID: ${projectId}`);
          
          // 4. 测试审核操作 - 发现参数验证问题
          console.log('\n4️⃣ 测试审核操作...');
          
          // 先测试正确的参数
          try {
            const auditResponse = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
              audit_result: 1, // 通过
              reject_reason: '' // 通过时不需要原因
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ 审核操作成功:', auditResponse.data);
          } catch (auditError) {
            console.error('❌ 审核操作失败:');
            console.error('   状态码:', auditError.response?.status);
            console.error('   错误信息:', auditError.response?.data);
            
            // 分析参数问题
            if (auditError.response?.data?.error === '参数验证失败') {
              console.log('🔍 参数验证失败分析:');
              console.log('   - audit_result 必须是 1(通过) 或 2(打回)');
              console.log('   - 当 audit_result=2 时，reject_reason 必填');
              console.log('   - 当 audit_result=1 时，reject_reason 可选');
            }
          }
          
          // 5. 测试打回操作
          console.log('\n5️⃣ 测试打回操作...');
          try {
            const rejectResponse = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
              audit_result: 2, // 打回
              reject_reason: '项目内容需要完善' // 打回时必须提供原因
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ 打回操作成功:', rejectResponse.data);
          } catch (rejectError) {
            console.error('❌ 打回操作失败:', rejectError.response?.data);
          }
        } else {
          console.log('⚠️ 没有待审核项目，创建测试项目...');
          
          // 创建测试学生用户和项目
          await createTestProject(token);
        }
      }
    } catch (loginError) {
      console.error('❌ 登录失败:', loginError.response?.data);
      
      // 检查是否需要修改登录API
      if (loginError.response?.data?.error?.includes('邮箱')) {
        console.log('🔧 需要修改登录API以支持用户名登录');
      }
    }
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error);
  }
}

// 创建测试项目
async function createTestProject(teacherToken) {
  try {
    console.log('\n📝 创建测试项目...');
    
    // 创建或获取学生用户
    const { data: studentUser } = await supabase
      .from('users')
      .select('*')
      .eq('role', 0) // role=0 表示学生
      .single();
    
    if (!studentUser) {
      console.log('❌ 没有找到学生用户');
      return;
    }
    
    // 创建测试成果
    const { data: achievement } = await supabase
      .from('achievements')
      .insert({
        publisher_id: studentUser.id,
        title: '测试项目 - ' + new Date().getTime(),
        description: '<p>这是一个测试项目的内容</p>',
        type_id: '00000000-0000-0000-0000-000000000000',
        status: 1, // 待审核
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    console.log('✅ 测试项目创建成功:', achievement);
    
    // 再次测试审核
    console.log('\n🔄 重新测试审核操作...');
    try {
      const auditResponse = await axios.post(`${API_BASE}/review/${achievement.id}/audit`, {
        audit_result: 1,
        reject_reason: ''
      }, {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      
      console.log('✅ 审核操作成功:', auditResponse.data);
    } catch (error) {
      console.error('❌ 审核仍然失败:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ 创建测试项目失败:', error);
  }
}

fixTeacherReviewAuth();