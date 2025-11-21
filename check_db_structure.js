import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkDatabaseStructure() {
  try {
    console.log('=== 检查数据库结构 ===');
    
    // 检查表是否存在
    const tables = ['profiles', 'projects', 'audit_records'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ 表 ${table} 不存在或错误: ${error.message}`);
        } else {
          console.log(`✅ 表 ${table} 存在，示例数据:`, data ? data.length : 0, '行');
          
          // 获取表结构
          const { data: structure, error: structError } = await supabase
            .rpc('get_table_columns', { table_name: table });
          
          if (!structError && structure) {
            console.log(`   字段:`, structure.map(col => col.column_name).join(', '));
          }
        }
      } catch (err) {
        console.log(`❌ 检查表 ${table} 时出错: ${err.message}`);
      }
    }
    
    // 尝试创建备份表
    console.log('\n=== 尝试创建备份表 ===');
    
    // 检查并创建备份表
    const backupTables = ['backup_profiles', 'backup_projects', 'backup_audit_records'];
    
    for (const backupTable of backupTables) {
      const originalTable = backupTable.replace('backup_', '');
      
      try {
        // 先检查原表是否存在
        const { data, error } = await supabase
          .from(originalTable)
          .select('*')
          .limit(1);
          
        if (!error) {
          // 原表存在，尝试创建备份
          const { error: backupError } = await supabase.rpc('create_backup_table', {
            source_table: originalTable,
            backup_table: backupTable
          });
          
          if (backupError) {
            console.log(`❌ 备份表 ${backupTable} 创建失败: ${backupError.message}`);
          } else {
            console.log(`✅ 备份表 ${backupTable} 创建成功`);
          }
        } else {
          console.log(`⚠️  原表 ${originalTable} 不存在，跳过备份`);
        }
        
      } catch (err) {
        console.log(`❌ 处理备份表 ${backupTable} 时出错: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('数据库检查失败:', error.message);
  }
}

// 创建存储过程来获取表结构
async function createGetTableColumnsProc() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
        RETURNS TABLE(column_name text, data_type text) 
        AS $$
        BEGIN
          RETURN QUERY 
          SELECT column_name::text, data_type::text
          FROM information_schema.columns 
          WHERE table_name = $1 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (error) {
      console.log('创建获取表结构函数失败:', error.message);
    }
  } catch (err) {
    console.log('创建函数出错:', err.message);
  }
}

// 创建备份表存储过程
async function createBackupTableProc() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION create_backup_table(source_table text, backup_table text)
        RETURNS void
        AS $$
        BEGIN
          EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', backup_table);
          EXECUTE format('CREATE TABLE %I AS SELECT * FROM %I', backup_table, source_table);
          RAISE NOTICE '备份表 % 创建成功', backup_table;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (error) {
      console.log('创建备份函数失败:', error.message);
    }
  } catch (err) {
    console.log('创建备份函数出错:', err.message);
  }
}

// 主函数
async function main() {
  await createGetTableColumnsProc();
  await createBackupTableProc();
  await checkDatabaseStructure();
}

main().catch(console.error);