import { supabase } from './src/config/supabase.js';

async function getAllTables() {
  console.log('🔍 获取数据库所有表结构...\n');
  
  try {
    // 获取所有表名
    const { data: tables, error } = await supabase
      .rpc('get_all_tables'); // 使用存储过程获取所有表
      
    if (error) {
      // 如果rpc失败，使用information_schema查询
      const { data, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');
        
      if (schemaError) {
        console.log('❌ 无法获取表列表:', schemaError.message);
        return;
      }
      
      console.log('📋 数据库中的所有表:');
      data.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name}`);
      });
      
      return data.map(t => t.table_name);
    }
    
  } catch (error) {
    console.log('❌ 查询失败:', error.message);
    
    // 使用SQL查询获取所有表
    const { data, error: sqlError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });
      
    if (sqlError) {
      console.log('❌ SQL查询失败:', sqlError.message);
      return;
    }
    
    console.log('📋 数据库中的所有表:');
    data.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    return data.map(t => t.table_name);
  }
}

// 获取每个表的详细结构
async function getTableDetails(tableName) {
  console.log(`\n📊 ${tableName} 表结构:`);
  
  try {
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns
          WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
          ORDER BY ordinal_position;
        `
      });
      
    if (error) {
      console.log(`❌ 无法获取${tableName}表结构:`, error.message);
      return null;
    }
    
    if (data && data.length > 0) {
      data.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        const maxLen = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        console.log(`  ${col.column_name}: ${col.data_type}${maxLen} ${nullable}${defaultVal}`);
      });
      return data;
    } else {
      console.log(`  ℹ️  ${tableName}表存在但没有字段信息`);
      return [];
    }
    
  } catch (error) {
    console.log(`❌ 查询${tableName}表失败:`, error.message);
    return null;
  }
}

async function main() {
  const tables = await getAllTables();
  
  if (tables && tables.length > 0) {
    console.log(`\n🔍 开始检查各表详细结构...`);
    
    // 批量获取表结构（限制为20个表避免超时）
    const limitedTables = tables.slice(0, 20);
    
    for (const tableName of limitedTables) {
      await getTableDetails(tableName);
      // 添加小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n✅ 完成！共检查了 ${limitedTables.length} 个表`);
    
    if (tables.length > 20) {
      console.log(`ℹ️  还有 ${tables.length - 20} 个表未检查，如需完整列表请运行SQL查询`);
    }
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 程序执行失败:', error);
  process.exit(1);
});