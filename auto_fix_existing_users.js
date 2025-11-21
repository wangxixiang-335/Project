import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function autoFixExistingUsers() {
  console.log('🔧 自动修复现有用户数据...\n');

  try {
    // 创建Supabase管理客户端
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. 获取现有用户列表...');
    
    // 方法1: 尝试通过API获取用户列表
    try {
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        console.log('❌ 无法通过API获取用户列表:', error.message);
        console.log('💡 尝试方法2...');
      } else {
        console.log(`✅ 找到 ${users.users.length} 个用户`);
        
        for (const user of users.users) {
          console.log(`   用户: ${user.email} (ID: ${user.id})`);
          
          // 检查该用户是否已有profile记录
          const { data: existingProfile, error: checkError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (checkError && checkError.code === 'PGRST116') {
            // 没有profile记录，需要创建
            console.log(`   ❌ ${user.email} 没有profile记录，正在创建...`);
            
            const profileData = {
              id: user.id,
              username: user.user_metadata?.username || user.email.split('@')[0],
              email: user.email,
              role: user.user_metadata?.role || 'student',
              created_at: user.created_at || new Date().toISOString()
            };

            const { error: insertError } = await supabaseAdmin
              .from('profiles')
              .insert(profileData);

            if (insertError) {
              console.log(`   ❌ 创建profile失败: ${insertError.message}`);
            } else {
              console.log(`   ✅ ${user.email} 的profile记录已创建`);
            }
          } else if (!checkError) {
            console.log(`   ✅ ${user.email} 已有profile记录`);
          } else {
            console.log(`   ❌ 检查profile失败: ${checkError.message}`);
          }
        }
        
        console.log('\n🎉 用户数据修复完成！');
        return;
      }
    } catch (apiError) {
      console.log('❌ API方法失败:', apiError.message);
    }

    // 方法2: 手动创建几个测试用户的profile
    console.log('\n2. 手动创建测试用户的profile记录...');
    console.log('💡 由于无法自动获取用户列表，请提供具体用户的UUID');
    
    // 示例：为已知用户创建profile（需要您提供实际UUID）
    const sampleUsers = [
      {
        id: 'REPLACE_WITH_ACTUAL_USER_ID_1', // 替换为实际用户ID
        email: 'user1@example.com',          // 替换为实际邮箱
        username: 'user1',                   // 替换为实际用户名
        role: 'student'
      },
      {
        id: 'REPLACE_WITH_ACTUAL_USER_ID_2', // 替换为实际用户ID
        email: 'user2@example.com',          // 替换为实际邮箱
        username: 'user2',                   // 替换为实际用户名
        role: 'teacher'
      }
    ];

    for (const user of sampleUsers) {
      if (user.id.startsWith('REPLACE')) {
        console.log(`   ⚠️ 跳过示例用户: ${user.email} (需要提供真实UUID)`);
        continue;
      }

      console.log(`   为 ${user.email} 创建profile...`);
      
      const profileData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData);

      if (insertError) {
        console.log(`   ❌ 创建失败: ${insertError.message}`);
      } else {
        console.log(`   ✅ ${user.email} 的profile记录已创建`);
      }
    }

    console.log('\n📋 下一步建议:');
    console.log('   1. 通过Supabase Dashboard获取用户UUID');
    console.log('   2. 更新脚本中的用户信息');
    console.log('   3. 重新运行此脚本');
    console.log('   4. 或者让用户重新注册（最简单）');

  } catch (error) {
    console.error('❌ 修复过程异常:', error);
  }
}

// 执行
autoFixExistingUsers();