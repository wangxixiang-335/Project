import { supabase } from './src/config/supabase.js';

async function checkDatabaseSchema() {
  try {
    console.log('🔍 检查achievements表的列信息...\n');
    
    // 查询achievements表的列信息
    const { data: columns, error } = await supabase
      .rpc('information_schema.columns', {
        table_name: 'achievements',
        table_schema: 'public'
      });

    if (error) {
      // 尝试直接查询information_schema
      const { data: columnInfo, error: infoError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, column_default, is_nullable')
        .eq('table_name', 'achievements')
        .eq('table_schema', 'public');

      if (infoError) {
        console.error('查询表结构错误:', infoError);
        return;
      }

      console.log('📋 achievements表列信息:');
      columnInfo.forEach(column => {
        console.log(`   ${column.column_name}:`);
        console.log(`      类型: ${column.data_type}`);
        console.log(`      可空: ${column.is_nullable}`);
        console.log(`      默认值: ${column.column_default || '无'}`);
        console.log('');
      });

      // 特别检查cover_url列
      const coverUrlColumn = columnInfo.find(col => col.column_name === 'cover_url');
      if (coverUrlColumn) {
        console.log('🔍 cover_url列详细信息:');
        console.log(`   类型: ${coverUrlColumn.data_type}`);
        console.log(`   可空: ${coverUrlColumn.is_nullable}`);
        console.log(`   默认值: ${coverUrlColumn.column_default || '无'}`);
        
        if (coverUrlColumn.column_default && coverUrlColumn.column_default.includes('placeholder')) {
          console.log('⚠️  发现cover_url列有默认占位符值！');
        } else {
          console.log('✅ cover_url列没有默认占位符值');
        }
      } else {
        console.log('❌ 未找到cover_url列');
      }
    }

  } catch (error) {
    console.error('检查失败:', error);
  }
}

// 运行检查
checkDatabaseSchema();