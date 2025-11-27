// 简化的注册测试
import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function testSimpleRegistration() {
  console.log('=== 简化注册测试 ===');
  
  try {
    const testUser = {
      email: 'test.register+' + Date.now() + '@gmail.com',
      password: 'password123',
      username: 'testuser_' + Date.now(),
      role: 'student'
    };
    
    console.log('测试邮箱:', testUser.email);
    console.log('Supabase URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...');
    console.log('使用服务端密钥:', process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key' ? '✅' : '❌ 使用匿名密钥');
    
    // 尝试普通注册（无需管理员权限）
    console.log('\n尝试普通注册...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: { 
          role: testUser.role, 
          username: testUser.username 
        }
      }
    });
    
    if (signUpError) {
      console.error('❌ 注册失败:', signUpError);
      console.log('错误代码:', signUpError.code);
      console.log('错误消息:', signUpError.message);
      
      // 如果是邮箱配置问题，尝试直接创建用户记录
      if (signUpError.code === 'email_address_invalid') {
        console.log('\n💡 邮箱可能被Supabase限制，尝试备用方案...');
        await tryDirectUserCreate(testUser);
      }
    } else {
      console.log('✅ 注册成功:', signUpData.user?.id);
      console.log('用户已创建，需要邮箱确认');
    }
  } catch (error) {
    console.error('❌ 测试异常:', error.message);
  }
}

async function tryDirectUserCreate(testUser) {
  console.log('\n=== 尝试直接创建用户记录（绕过Supabase Auth）===');
  
  try {
    // 生成一个简单的用户ID
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const userData = {
      id: userId,
      username: testUser.username,
      email: testUser.email,
      password_hash: 'temp_hash', // 临时哈希
      role: testUser.role === 'student' ? 1 : 2,
      created_at: new Date().toISOString()
    };
    
    console.log('创建用户数据:', userData);
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ 创建用户记录失败:', error);
    } else {
      console.log('✅ 用户记录创建成功:', data);
      console.log('💡 提示：此用户无法使用Supabase Auth登录，但可以通过自定义认证系统登录');
    }
  } catch (error) {
    console.error('❌ 直接创建失败:', error.message);
  }
}

testSimpleRegistration();