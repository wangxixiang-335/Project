import { supabase } from './src/config/supabase.js';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function debugLoginIssue() {
  console.log('=== 调试登录问题 ===\n');
  
  // 1. 检查数据库中的用户
  console.log('1️⃣ 检查数据库中的用户...');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 2); // 教师角色
    
    if (error) {
      console.log('❌ 查询用户失败:', error);
    } else {
      console.log(`✅ 找到 ${users.length} 个教师用户:`);
      users.forEach(user => {
        console.log(`  - ${user.username} (ID: ${user.id})`);
      });
    }
  } catch (err) {
    console.log('❌ 数据库查询异常:', err.message);
  }
  
  // 2. 检查Supabase Auth中的用户
  console.log('\n2️⃣ 检查Supabase Auth中的用户...');
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('❌ 获取Auth用户失败:', error);
    } else {
      const teacherUsers = users.filter(user => 
        user.email && user.email.includes('teacher')
      );
      console.log(`✅ 找到 ${teacherUsers.length} 个教师Auth用户:`);
      teacherUsers.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
    }
  } catch (err) {
    console.log('❌ Auth查询异常:', err.message);
  }
  
  // 3. 测试登录API
  console.log('\n3️⃣ 测试登录API...');
  const testCredentials = [
    { email: 'teacher1763610712207@example.com', password: 'password123' },
    { email: 'teacher1@example.com', password: 'password123' },
    { email: 'teacher@example.com', password: 'password123' }
  ];
  
  for (const cred of testCredentials) {
    console.log(`\n🔍 测试账号: ${cred.email}`);
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, cred);
      console.log('✅ 登录成功:', {
        success: response.data.success,
        user: response.data.data?.user?.username,
        role: response.data.data?.user?.role
      });
    } catch (error) {
      console.log('❌ 登录失败:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message
      });
    }
  }
  
  console.log('\n=== 调试完成 ===');
}

debugLoginIssue().catch(console.error);