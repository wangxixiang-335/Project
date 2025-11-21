import { supabase } from './src/config/supabase.js';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function fixAuthRole() {
  try {
    console.log('🔧 修复认证角色问题...');
    
    // 1. 检查现有的教师用户并修复metadata
    console.log('\n👥 检查并修复教师用户metadata...');
    const { data: teachers, error: teacherError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 2) // 数字2表示教师
      .limit(3);
    
    if (teacherError) {
      console.error('❌ 查询教师失败:', teacherError);
      return;
    }
    
    for (const teacher of teachers) {
      console.log(`🔧 修复教师 ${teacher.username} 的metadata...`);
      
      try {
        // 使用admin API更新用户metadata
        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
          teacher.id,
          {
            user_metadata: {
              role: 'teacher', // 确保是字符串
              username: teacher.username,
              full_name: teacher.username
            }
          }
        );
        
        if (updateError) {
          console.error(`❌ 更新教师 ${teacher.username} metadata失败:`, updateError);
        } else {
          console.log(`✅ 教师 ${teacher.username} metadata更新成功`);
        }
      } catch (adminError) {
        console.error(`❌ 更新教师 ${teacher.username} 时异常:`, adminError.message);
      }
    }
    
    // 2. 检查现有的学生用户并修复metadata
    console.log('\n🎓 检查并修复学生用户metadata...');
    const { data: students, error: studentError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 1) // 数字1表示学生
      .limit(5);
    
    if (studentError) {
      console.error('❌ 查询学生失败:', studentError);
    } else {
      for (const student of students) {
        console.log(`🔧 修复学生 ${student.username} 的metadata...`);
        
        try {
          const { data: updatedStudent, error: updateError } = await supabase.auth.admin.updateUserById(
            student.id,
            {
              user_metadata: {
                role: 'student', // 确保是字符串
                username: student.username,
                full_name: student.username
              }
            }
          );
          
          if (updateError) {
            console.error(`❌ 更新学生 ${student.username} metadata失败:`, updateError);
          } else {
            console.log(`✅ 学生 ${student.username} metadata更新成功`);
          }
        } catch (adminError) {
          console.error(`❌ 更新学生 ${student.username} 时异常:`, adminError.message);
        }
      }
    }
    
    // 3. 创建一个测试token来验证修复
    console.log('\n🔑 创建测试token...');
    
    // 使用第一个教师来测试
    if (teachers.length > 0) {
      const teacher = teachers[0];
      
      // 方法1: 尝试直接生成用户session
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: 'dummy-token',
          refresh_token: 'dummy-refresh'
        });
        
        if (sessionError) {
          console.log('⚠️ 创建session失败（预期）:', sessionError.message);
        }
      } catch (sessionException) {
        console.log('⚠️ Session异常（预期）:', sessionException.message);
      }
      
      // 方法2: 创建临时用户认证
      let testToken = null;
      try {
        // 为测试目的，创建一个模拟的有效JWT token
        // 这个token的payload包含正确的角色信息
        const payload = {
          aud: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
          sub: teacher.id,
          email: 'teacher@test.com',
          phone: '',
          app_metadata: {
            provider: 'email',
            role: 'teacher'
          },
          user_metadata: {
            role: 'teacher',
            username: teacher.username,
            full_name: '测试教师'
          },
          role: 'teacher' // 添加role字段
        };
        
        // 模拟JWT header和payload（这个不是真正的JWT，仅用于测试结构）
        testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
                   Buffer.from(JSON.stringify(payload)).toString('base64') + 
                   '.signature';
        
        console.log('✅ 创建测试token成功');
        
        // 4. 测试API调用
        console.log('\n📚 测试修复后的API...');
        try {
          const response = await axios.get(`${API_BASE}/teacher/student-achievements?page=1&pageSize=10`, {
            headers: { 
              Authorization: `Bearer ${testToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          
          console.log('✅ API调用成功!');
          console.log('📋 状态码:', response.status);
          console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
          
        } catch (apiError) {
          console.log('❌ API仍然失败，分析具体原因...');
          
          if (apiError.response) {
            console.log('📋 状态码:', apiError.response.status);
            console.log('📋 错误详情:', apiError.response.data);
            
            // 根据不同的错误提供具体的修复建议
            switch (apiError.response.status) {
              case 400:
                console.log('\n🔧 400错误修复建议:');
                console.log('1. 检查paginationSchema验证逻辑');
                console.log('2. 确认requireTeacher中间件正确');
                console.log('3. 验证数据库查询参数');
                break;
              case 401:
                console.log('\n🔧 401错误修复建议:');
                console.log('1. 确保JWT token格式正确');
                console.log('2. 检查Supabase认证配置');
                console.log('3. 验证token签名');
                break;
              case 403:
                console.log('\n🔧 403错误修复建议:');
                console.log('1. 确认用户角色是teacher');
                console.log('2. 检查requireRole中间件逻辑');
                break;
            }
          }
        }
        
        // 5. 提供手动测试的登录信息
        console.log('\n📋 手动测试信息:');
        console.log(`教师用户ID: ${teacher.id}`);
        console.log(`教师用户名: ${teacher.username}`);
        console.log('修复建议: 在Supabase Dashboard中为这个用户设置邮箱和密码');
        
      } catch (tokenError) {
        console.error('❌ 创建测试token失败:', tokenError.message);
      }
    }
    
    // 6. 检查认证中间件的实现
    console.log('\n🔍 检查认证中间件实现...');
    console.log('建议检查以下文件:');
    console.log('- src/middleware/auth.js: authenticateToken 和 requireTeacher 实现');
    console.log('- src/routes/teacher.js: 中间件使用方式');
    console.log('- src/config/supabase.js: Supabase客户端配置');
    
  } catch (error) {
    console.error('🔥 修复过程中发生错误:', error);
  }
}

fixAuthRole();