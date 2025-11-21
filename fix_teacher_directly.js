import { supabase, supabaseAdmin } from './src/config/supabase.js';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function fixTeacherDirectly() {
  try {
    console.log('🔧 直接修复教师账号问题...');
    
    // 1. 检查现有教师用户
    console.log('\n👥 检查现有教师用户...');
    const { data: teachers, error: teacherError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 2) // 教师
      .limit(5);
    
    if (teacherError) {
      console.error('❌ 查询教师失败:', teacherError);
      return;
    }
    
    console.log(`✅ 找到 ${teachers.length} 个教师用户:`);
    teachers.forEach((teacher, index) => {
      console.log(`👤 教师 ${index + 1}:`, {
        id: teacher.id,
        username: teacher.username,
        email: teacher.email,
        role: teacher.role
      });
    });
    
    // 2. 为第一个教师添加邮箱（如果缺失）
    if (teachers.length > 0) {
      const teacher = teachers[0];
      if (!teacher.email) {
        console.log('\n📧 为教师添加邮箱...');
        
        // 使用supabaseAdmin直接更新用户邮箱
        try {
          const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            teacher.id,
            { 
              email: 'teacher@supabase.local',
              user_metadata: {
                role: 'teacher',
                username: teacher.username,
                full_name: '测试教师'
              }
            }
          );
          
          if (updateError) {
            console.error('❌ 更新用户邮箱失败:', updateError);
          } else {
            console.log('✅ 用户邮箱更新成功');
            
            // 更新users表
            const { error: userUpdateError } = await supabase
              .from('users')
              .update({ email: 'teacher@supabase.local' })
              .eq('id', teacher.id);
            
            if (userUpdateError) {
              console.error('❌ 更新users表邮箱失败:', userUpdateError);
            } else {
              console.log('✅ users表邮箱更新成功');
            }
          }
        } catch (adminError) {
          console.error('❌ 管理员API调用失败:', adminError.message);
        }
      }
      
      // 3. 尝试生成一个有效的token
      console.log('\n🔑 生成访问token...');
      
      try {
        // 方法1: 创建一个magic link并提取token
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: teacher.email || 'teacher@supabase.local',
          options: {
            redirectTo: 'http://localhost:3000/api/auth/callback'
          }
        });
        
        if (linkError) {
          console.log('⚠️ 生成magic link失败:', linkError.message);
        } else {
          console.log('✅ Magic link生成成功');
          console.log('📋 Link:', linkData.properties?.action_link);
        }
      } catch (linkGenError) {
        console.log('⚠️ Link生成异常:', linkGenError.message);
      }
      
      // 4. 直接使用管理员权限创建一个临时token
      let testToken = null;
      try {
        const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.createSession({
          user: { id: teacher.id }
        });
        
        if (tokenError) {
          console.log('⚠️ 创建session失败:', tokenError.message);
        } else {
          testToken = tokenData.session.access_token;
          console.log('✅ 创建临时session成功');
        }
      } catch (sessionError) {
        console.log('⚠️ Session创建异常:', sessionError.message);
      }
      
      // 5. 如果没有有效token，创建一个用于测试的token
      if (!testToken) {
        console.log('🔧 创建测试token（仅用于API结构测试）...');
        testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIiLCJyb2xlIjoidGVhY2hlciIsImV4cCI6OTk5OTk5OTk5OX0.test';
      }
      
      // 6. 测试API
      console.log('\n📚 测试成果库API...');
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
        
      } catch (error) {
        console.log('❌ API调用失败，分析错误...');
        
        if (error.response) {
          console.log('📋 状态码:', error.response.status);
          console.log('📋 错误数据:', error.response.data);
          
          // 分析具体错误
          switch (error.response.status) {
            case 401:
              console.log('🔍 401错误: Token验证失败');
              console.log('   - Token格式可能不正确');
              console.log('   - Supabase可能无法验证自定义token');
              break;
            case 400:
              console.log('🔍 400错误: 请求参数或权限验证失败');
              console.log('   - paginationSchema验证可能失败');
              console.log('   - requireTeacher权限检查可能失败');
              console.log('   - 数据库查询参数可能有问题');
              break;
            case 403:
              console.log('🔍 403错误: 权限不足');
              console.log('   - 用户角色可能不是teacher');
              console.log('   - metadata中的role可能不正确');
              break;
            default:
              console.log('🔍 其他错误:', error.response.status);
          }
        } else {
          console.log('🔍 网络或其他错误:', error.message);
        }
      }
      
      // 7. 检查数据库数据完整性
      console.log('\n🔍 检查数据库数据完整性...');
      
      // 检查学生用户
      const { data: students, error: studentsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 1); // 学生
      
      if (studentsError) {
        console.error('❌ 查询学生失败:', studentsError);
      } else {
        console.log(`✅ 找到 ${students.length} 个学生用户`);
        
        // 检查学生成果
        if (students.length > 0) {
          const studentIds = students.map(s => s.id);
          const { data: achievements, error: achievementsError } = await supabase
            .from('achievements')
            .select('*')
            .in('publisher_id', studentIds)
            .neq('status', 0); // 排除草稿
          
          if (achievementsError) {
            console.error('❌ 查询学生成果失败:', achievementsError);
          } else {
            console.log(`✅ 找到 ${achievements.length} 个学生成果`);
            
            if (achievements.length > 0) {
              console.log('📋 第一个成果示例:', {
                id: achievements[0].id,
                title: achievements[0].title,
                publisher_id: achievements[0].publisher_id,
                status: achievements[0].status,
                score: achievements[0].score
              });
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('🔥 修复过程中发生错误:', error);
  }
}

fixTeacherDirectly();