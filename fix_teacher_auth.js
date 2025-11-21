import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixTeacherAuth() {
  console.log('🔍 检查用户认证信息...');
  
  try {
    // 尝试用服务角色密钥直接查询
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ 查询用户失败:', error);
      return;
    }
    
    console.log('✅ 找到用户:', users.users.length, '个');
    
    // 查找教师用户
    const teacherUser = users.users.find(user => 
      user.user_metadata?.role === 'teacher' || 
      user.email === '3888952060@qq.com'
    );
    
    if (teacherUser) {
      console.log('👨‍🏫 教师用户信息:');
      console.log('  📧 邮箱:', teacherUser.email);
      console.log('  🆔 ID:', teacherUser.id);
      console.log('  🔑 角色:', teacherUser.user_metadata?.role);
      console.log('  📅 创建时间:', teacherUser.created_at);
      
      // 尝试重置密码
      console.log('🔄 尝试为教师用户设置已知密码...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        teacherUser.id,
        { password: 'Teacher123!' }
      );
      
      if (updateError) {
        console.error('❌ 密码更新失败:', updateError);
      } else {
        console.log('✅ 教师密码已更新为: Teacher123!');
        console.log('📝 请使用以下信息登录测试:');
        console.log('  📧 邮箱: 3888952060@qq.com');
        console.log('  🔑 密码: Teacher123!');
      }
    } else {
      console.log('⚠️  没有找到教师用户');
      
      // 创建新的教师用户
      console.log('🆕 创建新的教师用户...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'teacher@example.com',
        password: 'Teacher123!',
        email_confirm: true,
        user_metadata: {
          username: 'testteacher',
          role: 'teacher'
        }
      });
      
      if (createError) {
        console.error('❌ 创建教师用户失败:', createError);
      } else {
        console.log('✅ 新教师用户创建成功');
        console.log('📝 登录信息:');
        console.log('  📧 邮箱: teacher@example.com');
        console.log('  🔑 密码: Teacher123!');
      }
    }
  } catch (error) {
    console.error('❌ 操作失败:', error);
  }
}

fixTeacherAuth();