import { supabase } from './src/config/supabase.js';

async function checkStudentUser() {
  try {
    console.log('🔍 检查学生用户信息...');
    
    // 查询profiles表中角色为学生的用户
    const { data: studentProfiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .limit(5);
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    console.log('找到的学生用户:');
    studentProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. ID: ${profile.id}`);
      console.log(`   用户名: ${profile.username}`);
      console.log(`   邮箱: ${profile.email}`);
      console.log(`   角色: ${profile.role}`);
      console.log(`   创建时间: ${profile.created_at}`);
      console.log('---');
    });
    
    // 尝试注册一个新学生用户
    console.log('\n📝 尝试注册新学生用户...');
    const testEmail = 'teststudent@example.com';
    const testPassword = 'test123456';
    const testUsername = '测试学生';
    
    // 先尝试登录已存在的测试账号
    console.log('\n🔑 尝试登录测试账号...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.log('❌ 登录失败:', loginError.message);
      
      // 如果登录失败，尝试注册新用户
      console.log('\n📝 注册新学生用户...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            username: testUsername,
            role: 'student'
          }
        }
      });
      
      if (signUpError) {
        console.error('❌ 注册失败:', signUpError);
      } else {
        console.log('✅ 注册成功:', signUpData.user.email);
        console.log('请使用以下账号登录测试:');
        console.log('邮箱:', testEmail);
        console.log('密码:', testPassword);
      }
    } else {
      console.log('✅ 登录成功:', loginData.user.email);
      console.log('用户ID:', loginData.user.id);
      
      // 获取用户信息
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();
      
      if (userProfile) {
        console.log('用户信息:', userProfile);
      }
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

checkStudentUser();