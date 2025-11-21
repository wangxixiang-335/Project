import { supabase, supabaseAdmin } from './src/config/supabase.js';

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
          console.log(`✅ 表 ${table} 存在，有 ${data ? data.length : 0} 行数据`);
        }
      } catch (err) {
        console.log(`❌ 检查表 ${table} 时出错: ${err.message}`);
      }
    }
    
    console.log('\n=== 尝试创建备份表 ===');
    
    // 尝试创建备份表
    for (const table of tables) {
      const backupTable = `backup_${table}`;
      
      try {
        // 先检查原表是否存在
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (!error) {
          // 原表存在，尝试创建备份
          console.log(`正在创建备份表 ${backupTable}...`);
          
          // 使用原始SQL创建备份表
          const { error: backupError } = await supabase.rpc('exec_sql', {
            sql: `DROP TABLE IF EXISTS ${backupTable}; CREATE TABLE ${backupTable} AS SELECT * FROM ${table};`
          });
          
          if (backupError) {
            console.log(`❌ 备份表 ${backupTable} 创建失败: ${backupError.message}`);
          } else {
            console.log(`✅ 备份表 ${backupTable} 创建成功`);
          }
        } else {
          console.log(`⚠️ 原表 ${table} 不存在，跳过备份`);
        }
        
      } catch (err) {
        console.log(`❌ 处理备份表 ${backupTable} 时出错: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('数据库检查失败:', error.message);
  }
}

// 运行检查
checkDatabaseStructure().catch(console.error);