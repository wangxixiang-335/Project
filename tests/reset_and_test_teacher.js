import { supabase } from './src/config/supabase.js';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function resetAndTestTeacher() {
  try {
    console.log('🔄 开始重置和测试教师账号...');
    
    // 1. 清理现有的测试用户
    console.log('\n🗑️ 清理现有测试用户...');
    const testEmails = [
      'teacher@test.com',
      'testteacher@example.com',
      'teacher@example.com'
    ];
    
    for (const email of testEmails) {
      try {
        // 尝试删除认证用户（需要管理员权限，可能失败）
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError) {
          const user = users.users.find(u => u.email === email);
          if (user) {
            await supabase.auth.admin.deleteUser(user.id);
            console.log(`✅ 删除认证用户: ${email}`);
          }
        }
      } catch (error) {
        console.log(`⚠️ 无法删除用户 ${email}:`, error.message);
      }
    }
    
    // 2. 创建新的教师认证账号
    console.log('\n👤 创建新的教师认证账号...');
    const teacherEmail = 'testteacher2024@example.com';
    const teacherPassword = '123456';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: teacherEmail,
      password: teacherPassword,
      options: {
        data: {
          role: 'teacher',
          full_name: '测试教师',
          username: 'testteacher2024'
        }
      }
    });
    
    if (authError && !authError.message.includes('already registered')) {
      console.error('❌ 创建认证账号失败:', authError);
      return;
    }
    
    let userId;
    if (authError?.message.includes('already registered')) {
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
      userId = authData.user.id;
      console.log('✅ 认证账号创建成功:', authData.user.email);
    }
    
    // 3. 确保users表中有记录
    console.log('\n📝 确保users表中有教师记录...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ 检查用户记录失败:', checkError);
      return;
    }
    
    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: 'testteacher2024',
          email: teacherEmail,
          role: 2, // 教师角色
          class_id: null
        });
      
      if (insertError) {
        console.error('❌ 插入用户记录失败:', insertError);
        return;
      }
      
      console.log('✅ 用户记录插入成功');
    } else {
      console.log('✅ 用户记录已存在:', existingUser.username);
    }
    
    // 4. 测试登录API
    console.log('\n🔐 测试登录API...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/users/login`, {
        email: teacherEmail,
        password: teacherPassword
      });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.token;
        console.log('✅ 登录API成功!');
        console.log('📋 Token:', token.substring(0, 50) + '...');
        
        // 5. 测试成果库API
        console.log('\n📚 测试成果库API...');
        try {
          const libraryResponse = await axios.get(`${API_BASE}/teacher/student-achievements?page=1&pageSize=10`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (libraryResponse.data.success) {
            console.log('✅ 成果库API成功!');
            console.log('📋 返回数据:', JSON.stringify(libraryResponse.data, null, 2));
          } else {
            console.log('⚠️ 成果库API返回:', libraryResponse.data);
          }
        } catch (libraryError) {
          console.error('❌ 成果库API失败:', libraryError.response?.data || libraryError.message);
        }
        
        // 6. 保存登录信息到本地存储模拟
        console.log('\n💾 保存登录信息...');
        console.log('请在浏览器控制台中运行以下代码来设置token:');
        console.log(`localStorage.setItem('teacherToken', '${token}');`);
        console.log(`localStorage.setItem('user', '${JSON.stringify(loginResponse.data.data.user)}');`);
        
      } else {
        console.error('❌ 登录API返回失败:', loginResponse.data);
      }
      
    } catch (loginApiError) {
      console.error('❌ 登录API调用失败:', loginApiError.response?.data || loginApiError.message);
    }
    
    console.log('\n📋 测试完成！教师账号信息:');
    console.log(`邮箱: ${teacherEmail}`);
    console.log(`密码: ${teacherPassword}`);
    console.log(`用户名: testteacher2024`);
    
  } catch (error) {
    console.error('🔥 重置过程中发生错误:', error);
  }
}

resetAndTestTeacher();