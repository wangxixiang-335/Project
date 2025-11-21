import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTeachers() {
  console.log('🔍 检查教师用户...');
  
  // 检查profiles表中role为teacher的用户
  const { data: teachers, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher');
    
  if (error) {
    console.error('❌ 查询教师失败:', error);
    return;
  }
  
  console.log('✅ 找到教师用户:', teachers.length, '个');
  teachers.forEach(teacher => {
    console.log('👨‍🏫 教师信息:', {
      id: teacher.id,
      username: teacher.username,
      email: teacher.email,
      role: teacher.role
    });
  });
  
  if (teachers.length === 0) {
    console.log('⚠️  没有找到教师用户，创建一个测试教师账户...');
    
    // 创建测试教师账户
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: 'teacher@example.com',
      password: 'password123',
      options: {
        data: {
          username: 'testteacher',
          role: 'teacher'
        }
      }
    });
    
    if (authError) {
      console.error('❌ 创建教师账户失败:', authError);
      return;
    }
    
    console.log('✅ 测试教师账户创建成功');
    console.log('📧 邮箱: teacher@example.com');
    console.log('🔑 密码: password123');
  }
}

checkTeachers();