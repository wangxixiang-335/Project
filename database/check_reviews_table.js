import { supabase } from './src/config/supabase.js';

async function checkReviewsTable() {
  console.log('🔍 检查project_reviews表详细结构...\n');
  
  try {
    // 获取表结构信息
    const { data, error } = await supabase
      .from('project_reviews')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('❌ 查询失败:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Project_reviews表字段:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`  - ${col}: ${data[0][col] === null ? 'null' : typeof data[0][col]}`);
      });
      
      // 检查score字段
      if (columns.includes('score')) {
        console.log('\n✅ 找到score字段！');
      }
    } else {
      console.log('ℹ️  project_reviews表没有数据，检查表是否存在...');
      
      // 尝试描述表结构
      const { data: tableInfo, error: infoError } = await supabase
        .rpc('get_table_columns', { table_name: 'project_reviews' });
        
      if (!infoError && tableInfo) {
        console.log('✅ 表结构信息:');
        tableInfo.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
      }
    }
    
  } catch (error) {
    console.log('❌ 检查失败:', error.message);
  }
}

checkReviewsTable();