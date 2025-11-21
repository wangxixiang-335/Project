import { supabase } from './src/config/supabase.js';

async function checkRealStructure() {
  try {
    console.log('检查实际数据库结构...');
    
    // 1. 尝试获取所有表名
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('schema', 'public')
      .like('table_name', '%project%');
      
    if (tablesError) {
      console.log('无法获取表信息:', tablesError);
    } else {
      console.log('包含project的表:', tables);
    }
    
    // 2. 尝试常见的表名变体
    const possibleTables = [
      'projects',
      'project',
      'project_view',
      'projects_view',
      'achievements',
      'achievement'
    ];
    
    for (const tableName of possibleTables) {
      try {
        console.log(`\\n尝试访问表: ${tableName}`);
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName}: 表存在，有 ${data?.length || 0} 条记录`);
          if (data && data.length > 0) {
            console.log(`     字段: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: ${err.message}`);
      }
    }
    
    // 3. 检查用户/学生表
    console.log('\\n检查用户相关表:');
    const userTables = ['profiles', 'users', 'students', 'teachers'];
    
    for (const tableName of userTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName}: 表存在，有 ${data?.length || 0} 条记录`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('检查过程中出错:', error);
  }
}

checkRealStructure();