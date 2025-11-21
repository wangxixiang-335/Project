import { supabase } from './src/config/supabase.js';

async function createTeacherAuth() {
  try {
    console.log('🔧 创建教师认证账号...');
    
    // 创建教师认证账号
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'teacher@test.com',
      password: '123456',
      options: {
        data: {
          role: 'teacher',
          full_name: '测试教师',
          username: 'teacher'
        }
      }
    });
    
    if (authError) {
      console.error('❌ 创建认证账号失败:', authError);
      
      // 如果用户已存在，尝试直接登录
      if (authError.message.includes('already registered')) {
        console.log('📋 用户已存在，尝试登录...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: 'teacher@test.com',
          password: '123456'
        });
        
        if (loginError) {
          console.error('❌ 登录失败:', loginError);
        } else {
          console.log('✅ 登录成功:', loginData);
          
          // 确保users表中有记录
          await ensureUserRecord(loginData.user.id, 'teacher@test.com');
        }
      }
      return;
    }
    
    console.log('✅ 认证账号创建成功:', authData);
    
    // 在users表中添加记录
    if (authData.user) {
      await ensureUserRecord(authData.user.id, 'teacher@test.com');
    }
    
  } catch (error) {
    console.error('🔥 创建过程中发生错误:', error);
  }
}

async function ensureUserRecord(userId, email) {
  try {
    // 检查users表中是否已有记录
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
      // 创建用户记录
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: 'teacher',
          email: email,
          role: 2, // 教师角色
          class_id: null
        });
      
      if (insertError) {
        console.error('❌ 插入用户记录失败:', insertError);
      } else {
        console.log('✅ 用户记录插入成功');
      }
    } else {
      console.log('✅ 用户记录已存在:', existingUser);
    }
  } catch (error) {
    console.error('🔥 确保用户记录时发生错误:', error);
  }
}

createTeacherAuth();