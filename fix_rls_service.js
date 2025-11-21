import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// 使用service role key直接连接数据库
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量：SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSWithServiceRole() {
  console.log('🛠️ 使用Service Role修复RLS无限递归问题...');
  console.log('');

  try {
    // 读取修复SQL
    const fs = await import('fs');
    const sqlContent = fs.readFileSync('./fix_rls_simple.sql', 'utf8');
    
    console.log('执行SQL修复脚本...');
    
    // 分段执行SQL，避免一次性执行太多语句
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('DROP POLICY') || statement.includes('CREATE POLICY') || statement.includes('CREATE OR REPLACE FUNCTION')) {
        try {
          console.log(`执行: ${statement.substring(0, 50)}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  执行失败:`, error.message);
          } else {
            console.log(`✅ 执行成功`);
          }
        } catch (err) {
          console.log(`⚠️  执行出错:`, err.message);
        }
      }
    }

    console.log('\n🎉 RLS修复尝试完成！');
    
    // 验证修复结果
    console.log('\n验证修复结果...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, username, role')
      .limit(1);
    
    if (testError) {
      console.log('❌ 验证查询失败:', testError.message);
    } else {
      console.log('✅ 验证查询成功，找到', testData?.length || 0, '条记录');
    }

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

fixRLSWithServiceRole();