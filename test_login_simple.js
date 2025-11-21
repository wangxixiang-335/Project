import { supabase } from './src/config/supabase.js';

async function testLogin() {
  console.log('测试登录...');
  
  const testUsers = [
    { email: 'teacher1@example.com', password: 'password123' },
    { email: 'student1@example.com', password: 'password123' },
  ];
  
  for (const user of testUsers) {
    console.log(`\n尝试登录: ${user.email}`);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });
      
      if (error) {
        console.log('失败:', error.message);
      } else {
        console.log('成功! 用户:', data.user.email);
        console.log('Token:', data.session?.access_token ? '有token' : '无token');
        
        // 使用这个token测试审核功能
        if (data.session?.access_token) {
          console.log('\n测试审核功能...');
          try {
            const auditResponse = await fetch('http://localhost:3000/api/review/dc8914c5-60f2-449c-8dee-89095b02952d/audit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`
              },
              body: JSON.stringify({
                audit_result: 1,
                reject_reason: ''
              })
            });
            
            const result = await auditResponse.json();
            console.log('审核响应:', auditResponse.status, result);
          } catch (auditError) {
            console.log('审核测试失败:', auditError.message);
          }
        }
      }
    } catch (err) {
      console.log('异常:', err.message);
    }
  }
}

testLogin();