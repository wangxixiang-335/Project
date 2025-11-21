import { supabaseAdmin } from '../src/config/supabase.js';
import fs from 'fs';
import path from 'path';

async function applyRLSPolicies() {
  try {
    console.log('开始应用 RLS 策略...');
    
    // 读取 SQL 文件
    const sqlFilePath = path.join(process.cwd(), 'supabase', 'rls_policies.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 按语句分割（简单的分号分割，实际可能需要更复杂的分割逻辑）
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      console.log(`执行语句 ${i + 1}/${statements.length}:`);
      console.log(stmt.substring(0, 100) + '...');
      
      // 使用 supabaseAdmin（服务端密钥）执行 SQL
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        console.error(`❌ 语句执行失败:`, error.message);
        
        // 如果是策略已存在错误，可以跳过
        if (error.message.includes('already exists')) {
          console.log('⚠️  策略已存在，跳过...');
          continue;
        }
        
        throw error;
      }
      
      console.log('✅ 语句执行成功');
    }
    
    console.log('🎉 RLS 策略应用完成！');
    
  } catch (error) {
    console.error('❌ 应用 RLS 策略失败:', error.message);
    process.exit(1);
  }
}

// 如果没有 exec_sql 函数，我们使用更直接的方法
async function applyPoliciesDirectly() {
  console.log('使用直接方法应用 RLS 策略...');
  
  // 这里列出需要执行的策略语句
  const policies = [
    // 修复教师查看策略
    `DROP POLICY IF EXISTS "教师可以查看所有用户profile" ON profiles`,
    `CREATE POLICY "教师可以查看所有用户profile" ON profiles
        FOR SELECT USING (
            auth.uid() IN (
                SELECT id FROM profiles 
                WHERE role = 'teacher'
            )
        )`,
    
    // 添加注册插入策略
    `DROP POLICY IF EXISTS "用户注册创建profile" ON profiles`,
    `CREATE POLICY "用户注册创建profile" ON profiles
        FOR INSERT WITH CHECK (id = auth.uid())`
  ];
  
  for (const policy of policies) {
    console.log('执行:', policy.substring(0, 80) + '...');
    
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policy });
    
    if (error) {
      console.error('执行失败:', error.message);
      
      // 如果是函数不存在，建议使用 Dashboard 方法
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.log('\n⚠️ 请使用 Supabase Dashboard 执行 SQL 语句：');
        console.log('1. 访问 https://supabase.com/dashboard/project/dribyphhqfplatxuhnsg');
        console.log('2. 点击左侧 SQL Editor');
        console.log('3. 复制粘贴以下内容并执行:');
        console.log('\n' + policies.join(';\n\n') + ';');
        return;
      }
    } else {
      console.log('✅ 执行成功');
    }
  }
}

// 尝试执行
applyPoliciesDirectly().catch(console.error);