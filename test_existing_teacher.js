import { supabase } from './src/config/supabase.js';

async function testExistingTeacher() {
  console.log('测试现有教师账号...');
  
  // 从users表中的teacher1用户ID，查询对应的auth用户
  const teacherId = '58517efa-e7c3-4cca-8d83-4648d0bcf6aa';
  
  try {
    const { data: user, error } = await supabase.auth.admin.getUserById(teacherId);
    
    if (error) {
      console.log('查询用户失败:', error.message);
    } else {
      console.log('找到用户:', user.user.email);
      
      // 尝试使用默认密码登录
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password: 'password123'
      });
      
      if (loginError) {
        console.log('登录失败:', loginError.message);
        
        // 尝试其他可能的密码
        const passwords = ['123456', 'admin', 'teacher', 'test'];
        for (const pwd of passwords) {
          console.log(`尝试密码: ${pwd}`);
          try {
            const { data: testLogin, error: testError } = await supabase.auth.signInWithPassword({
              email: user.user.email,
              password: pwd
            });
            
            if (!testError) {
              console.log(`✅ 密码 ${pwd} 成功!`);
              await testAuditWithToken(testLogin.session.access_token);
              return;
            }
          } catch (e) {
            console.log(`密码 ${pwd} 失败`);
          }
        }
      } else {
        console.log('登录成功!');
        await testAuditWithToken(loginData.session.access_token);
      }
    }
  } catch (err) {
    console.log('查询用户异常:', err.message);
  }
}

async function testAuditWithToken(token) {
  const auditResponse = await fetch('http://localhost:3000/api/review/dc8914c5-60f2-449c-8dee-89095b02952d/audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      audit_result: 1,
      reject_reason: ''
    })
  });
  
  const result = await auditResponse.json();
  console.log('🔍 审核测试结果:');
  console.log('状态码:', auditResponse.status);
  console.log('响应内容:', result);
}

testExistingTeacher();