import { supabase, supabaseAdmin } from './src/config/supabase.js';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function createWorkingTeacher() {
  try {
    console.log('🔧 创建可用的教师账号...');
    
    // 1. 创建Supabase认证用户
    const teacherEmail = `teacher${Date.now()}@test.com`;
    const teacherPassword = '123456';
    
    console.log('\n👤 创建Supabase认证用户...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: teacherEmail,
      password: teacherPassword,
      options: {
        data: {
          role: 'teacher',
          full_name: '测试教师',
          username: `teacher${Date.now()}`
        }
      }
    });
    
    let userId;
    
    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        console.log('📋 用户已存在，尝试登录...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: teacherEmail,
          password: teacherPassword
        });
        
        if (loginError) {
          console.error('❌ 登录失败:', loginError);
          return;
        }
        
        userId = loginData.user.id;
        console.log('✅ 登录成功:', loginData.user.email);
      } else {
        console.error('❌ 创建认证用户失败:', authError);
        return;
      }
    } else {
      userId = authData.user.id;
      console.log('✅ 认证用户创建成功:', authData.user.email);
    }
    
    // 2. 确保users表中有记录
    console.log('\n📝 确保users表中有教师记录...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ 检查用户记录失败:', checkError);
    } else if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: `teacher${Date.now()}`,
          email: teacherEmail,
          role: 2, // 教师角色
          class_id: null
        });
      
      if (insertError) {
        console.error('❌ 插入用户记录失败:', insertError);
      } else {
        console.log('✅ 用户记录插入成功');
      }
    } else {
      console.log('✅ 用户记录已存在');
    }
    
    // 3. 创建一些学生用户和测试数据
    console.log('\n🎓 创建测试学生用户...');
    const studentEmail = `student${Date.now()}@test.com`;
    const studentPassword = '123456';
    
    const { data: studentAuthData, error: studentAuthError } = await supabase.auth.signUp({
      email: studentEmail,
      password: studentPassword,
      options: {
        data: {
          role: 'student',
          full_name: '测试学生',
          username: `student${Date.now()}`
        }
      }
    });
    
    let studentId;
    
    if (studentAuthError && !studentAuthError.message.includes('already registered')) {
      console.error('❌ 创建学生认证用户失败:', studentAuthError);
    } else {
      studentId = studentAuthData?.user?.id;
      
      if (studentId) {
        // 插入学生记录
        const { error: studentInsertError } = await supabase
          .from('users')
          .insert({
            id: studentId,
            username: `student${Date.now()}`,
            email: studentEmail,
            role: 1, // 学生角色
            class_id: null
          });
        
        if (studentInsertError) {
          console.error('❌ 插入学生记录失败:', studentInsertError);
        } else {
          console.log('✅ 学生用户创建成功');
          
          // 4. 创建一些测试成果
          console.log('\n📚 创建测试学生成果...');
          const testAchievements = [
            {
              title: '人工智能聊天机器人',
              description: '基于深度学习的智能对话系统',
              type_id: 1,
              status: 2, // 已通过
              score: 92,
              publisher_id: studentId,
              instructor_id: userId
            },
            {
              title: '在线学习平台设计',
              description: '响应式网页设计和用户体验优化',
              type_id: 2,
              status: 2, // 已通过
              score: 88,
              publisher_id: studentId,
              instructor_id: userId
            },
            {
              title: '数据分析可视化工具',
              description: '基于Python的数据分析和可视化系统',
              type_id: 1,
              status: 1, // 待审核
              score: null,
              publisher_id: studentId,
              instructor_id: userId
            }
          ];
          
          for (const achievement of testAchievements) {
            const { data: inserted, error: insertError } = await supabase
              .from('achievements')
              .insert(achievement)
              .select();
            
            if (insertError) {
              console.error('❌ 插入成果失败:', insertError);
            } else {
              console.log('✅ 插入成果成功:', inserted[0].title);
            }
          }
        }
      }
    }
    
    // 5. 测试登录并获取token
    console.log('\n🔐 测试教师登录...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/users/login`, {
        email: teacherEmail,
        password: teacherPassword
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.token;
        console.log('✅ 教师登录成功!');
        console.log('📋 Token:', token.substring(0, 50) + '...');
        
        // 6. 测试成果库API
        console.log('\n📚 测试成果库API...');
        try {
          const libraryResponse = await axios.get(`${API_BASE}/teacher/student-achievements?page=1&pageSize=10`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (libraryResponse.data.success) {
            console.log('✅ 成果库API成功!');
            console.log('📋 返回成果数量:', libraryResponse.data.data?.length || 0);
            
            if (libraryResponse.data.data && libraryResponse.data.data.length > 0) {
              console.log('📋 第一个成果:', {
                id: libraryResponse.data.data[0].id,
                title: libraryResponse.data.data[0].title,
                student_name: libraryResponse.data.data[0].student_name,
                score: libraryResponse.data.data[0].score
              });
            }
          } else {
            console.log('⚠️ 成果库API返回:', libraryResponse.data);
          }
        } catch (libraryError) {
          console.error('❌ 成果库API失败:', libraryError.response?.data || libraryError.message);
        }
        
        // 7. 保存登录信息供前端使用
        console.log('\n💾 前端使用说明:');
        console.log('在浏览器控制台中运行:');
        console.log(`localStorage.setItem('teacherToken', '${token}');`);
        console.log(`localStorage.setItem('user', '${JSON.stringify(loginResponse.data.data.user).replace(/'/g, "\\'")}');`);
        
        console.log('\n📋 账号信息:');
        console.log(`教师邮箱: ${teacherEmail}`);
        console.log(`教师密码: ${teacherPassword}`);
        console.log(`学生邮箱: ${studentEmail}`);
        console.log(`学生密码: ${studentPassword}`);
        
      } else {
        console.error('❌ 教师登录失败:', loginResponse.data);
      }
      
    } catch (loginApiError) {
      console.error('❌ 登录API调用失败:', loginApiError.response?.data || loginApiError.message);
    }
    
  } catch (error) {
    console.error('🔥 创建教师账号时发生错误:', error);
  }
}

createWorkingTeacher();