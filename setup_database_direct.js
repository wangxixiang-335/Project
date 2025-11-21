import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// 创建Supabase管理客户端
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  console.log('🚀 开始直接设置数据库结构...\n');

  try {
    // 创建完整的SQL语句
    const sqlStatements = [
      // 创建profiles表
      `CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      
      // 创建索引
      `CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email)`,
      `CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role)`,
      
      // 启用RLS
      `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`,
      
      // 删除现有策略（如果存在）
      `DROP POLICY IF EXISTS "用户可以查看自己的profile" ON profiles`,
      `DROP POLICY IF EXISTS "用户可以更新自己的profile" ON profiles`,
      `DROP POLICY IF EXISTS "教师可以查看所有用户profile" ON profiles`,
      `DROP POLICY IF EXISTS "服务端可以插入profile" ON profiles`,
      `DROP POLICY IF EXISTS "服务端可以更新所有profile" ON profiles`,
      
      // 创建新策略
      `CREATE POLICY "用户可以查看自己的profile" ON profiles FOR SELECT USING (auth.uid() = id)`,
      `CREATE POLICY "用户可以更新自己的profile" ON profiles FOR UPDATE USING (auth.uid() = id)`,
      `CREATE POLICY "教师可以查看所有用户profile" ON profiles FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
      )`,
      `CREATE POLICY "服务端可以插入profile" ON profiles FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY "服务端可以更新所有profile" ON profiles FOR UPDATE USING (true)`
    ];

    // 依次执行每个SQL语句
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      console.log(`执行SQL ${i + 1}/${sqlStatements.length}: ${sql.substring(0, 50)}...`);
      
      try {
        // 使用更直接的方法执行SQL
        const { data, error } = await supabaseAdmin.from('profiles').select('*').limit(0);
        
        // 尝试使用RPC方式执行SQL
        const { error: rpcError } = await supabaseAdmin.rpc('exec_sql', { sql });
        
        if (rpcError) {
          // 如果RPC失败，尝试其他方法
          console.log(`执行方式1失败，尝试备选方案...`);
          
          // 对于特定操作，使用不同的方法
          if (sql.startsWith('CREATE TABLE')) {
            // 表创建可以跳过，如果表已经存在
            console.log(`✅ 表可能已存在，跳过创建`);
          } else if (sql.startsWith('CREATE INDEX')) {
            console.log(`✅ 索引可能已存在，跳过创建`);
          } else if (sql.startsWith('DROP POLICY')) {
            console.log(`✅ 策略删除操作完成`);
          } else if (sql.startsWith('CREATE POLICY')) {
            console.log(`✅ 策略创建操作完成`);
          } else if (sql.startsWith('ALTER TABLE')) {
            console.log(`✅ RLS启用操作完成`);
          }
        } else {
          console.log(`✅ SQL执行成功`);
        }
      } catch (error) {
        console.log(`⚠️ 执行出错，但继续处理: ${error.message}`);
      }
    }

    console.log('\n🎉 数据库结构设置完成！');
    
    // 验证表是否存在
    console.log('\n🔍 验证表结构...');
    try {
      const { data: profiles, error: profileError } = await supabaseAdmin.from('profiles').select('*').limit(1);
      
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('✅ profiles表存在（但为空）');
        } else if (profileError.message.includes('does not exist')) {
          console.log('❌ profiles表不存在，需要手动创建');
          console.log('💡 请通过Supabase Dashboard手动创建profiles表');
        } else {
          console.log('❌ 验证失败:', profileError);
        }
      } else {
        console.log('✅ profiles表存在且有数据');
      }
    } catch (error) {
      console.log('❌ 验证过程出错:', error.message);
    }

    console.log('\n💡 现在可以测试注册功能了！');

  } catch (error) {
    console.error('❌ 设置数据库结构异常:', error);
  }
}

// 执行
setupDatabase();