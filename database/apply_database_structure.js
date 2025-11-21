import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// 直接创建Supabase管理客户端（使用服务角色密钥）
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyDatabaseStructure() {
  console.log('🚀 开始应用数据库结构...\n');

  try {
    // 测试连接
    console.log('🔗 测试数据库连接...');
    const { data: testData, error: testError } = await supabaseAdmin.from('auth.users').select('id').limit(1);
    
    if (testError) {
      console.error('❌ 数据库连接失败:', testError);
      return;
    }
    console.log('✅ 数据库连接成功');

    // 1. 创建profiles表
    console.log('\n🏗️ 创建profiles表...');
    const { error: createProfileError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`
    });

    if (createProfileError && !createProfileError.message.includes('already exists')) {
      console.error('❌ 创建profiles表失败:', createProfileError);
    } else {
      console.log('✅ profiles表创建/已存在');
    }

    // 2. 创建索引
    console.log('\n🔍 创建索引...');
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
        CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
        CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
      `
    });

    if (indexError && !indexError.message.includes('already exists')) {
      console.error('❌ 创建索引失败:', indexError);
    } else {
      console.log('✅ 索引创建完成');
    }

    // 3. 启用RLS
    console.log('\n🔒 启用行级安全...');
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY'
    });

    if (rlsError) {
      console.error('❌ 启用RLS失败:', rlsError);
    } else {
      console.log('✅ RLS已启用');
    }

    // 4. 创建RLS策略
    console.log('\n🛡️ 创建RLS策略...');
    const policies = [
      `DROP POLICY IF EXISTS "用户可以查看自己的profile" ON profiles`,
      `CREATE POLICY "用户可以查看自己的profile" ON profiles FOR SELECT USING (auth.uid() = id)`,
      
      `DROP POLICY IF EXISTS "用户可以更新自己的profile" ON profiles`,
      `CREATE POLICY "用户可以更新自己的profile" ON profiles FOR UPDATE USING (auth.uid() = id)`,
      
      `DROP POLICY IF EXISTS "教师可以查看所有用户profile" ON profiles`,
      `CREATE POLICY "教师可以查看所有用户profile" ON profiles FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
      )`,
      
      `DROP POLICY IF EXISTS "服务端可以插入profile" ON profiles`,
      `CREATE POLICY "服务端可以插入profile" ON profiles FOR INSERT WITH CHECK (true)`,
      
      `DROP POLICY IF EXISTS "服务端可以更新所有profile" ON profiles`,
      `CREATE POLICY "服务端可以更新所有profile" ON profiles FOR UPDATE USING (true)`
    ];

    for (const policy of policies) {
      const { error: policyError } = await supabaseAdmin.rpc('exec_sql', { sql: policy });
      if (policyError && !policyError.message.includes('does not exist') && !policyError.message.includes('already exists')) {
        console.error('❌ 创建RLS策略失败:', policyError);
      }
    }
    console.log('✅ RLS策略创建完成');

    // 5. 验证表结构
    console.log('\n✅ 验证表结构...');
    const { data: profiles, error: profileError } = await supabaseAdmin.from('profiles').select('*').limit(1);
    
    if (profileError && profileError.code === 'PGRST116') {
      console.log('📊 profiles表为空，但结构已创建');
    } else if (profileError) {
      console.error('❌ 验证表结构失败:', profileError);
    } else {
      console.log('✅ profiles表结构验证成功');
    }

    console.log('\n🎉 数据库结构应用完成！');
    console.log('💡 现在可以重新测试注册功能了！');

  } catch (error) {
    console.error('❌ 应用数据库结构异常:', error);
  }
}

// 执行
applyDatabaseStructure();