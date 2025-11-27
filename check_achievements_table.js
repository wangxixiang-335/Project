import { supabase } from './src/config/supabase.js';

async function checkAchievementsTable() {
  try {
    console.log('=== 检查achievements表结构 ===');
    
    // 查询表结构
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('查询achievements表失败:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('achievements表数据示例:');
      console.log('字段:', Object.keys(data[0]));
      console.log('数据:', data[0]);
    } else {
      console.log('achievements表为空，检查表结构...');
    }
    
    // 尝试直接查询表结构
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'achievements')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (colError) {
      console.log('获取表结构失败:', colError.message);
    } else {
      console.log('\nachievements表结构:');
      columns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    }
    
  } catch (error) {
    console.error('检查失败:', error.message);
  }
}

checkAchievementsTable();