import { supabase } from './src/config/supabase.js';

async function checkTables() {
  console.log('🔍 检查数据库表结构...\n');
  
  const tables = ['projects', 'projects_view', 'achievements'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table} 表: 不存在或无法访问 - ${error.message}`);
      } else {
        console.log(`✅ ${table} 表: 存在，数据条数: ${data ? data.length : 0}`);
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   字段: ${columns.join(', ')}`);
        }
      }
    } catch (e) {
      console.log(`⚠️  ${table} 表: 检查失败 - ${e.message}`);
    }
    console.log('');
  }
  
  // 检查实际存在的表
  console.log('📋 检查information_schema中的表信息:');
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['projects', 'projects_view', 'achievements']);
    
    if (error) {
      console.log('❌ 无法查询information_schema:', error.message);
    } else {
      console.log('✅ 找到的表:', data.map(d => d.table_name));
    }
  } catch (e) {
    console.log('⚠️  information_schema查询失败:', e.message);
  }
}

checkTables().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ 检查失败:', error);
  process.exit(1);
});