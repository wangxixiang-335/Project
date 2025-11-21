import { supabaseAdmin } from './src/config/supabase.js';

async function checkAndFixProjectsTable() {
  try {
    console.log('🔍 检查projects表结构...');
    
    // 检查当前表结构
    const { data: columns, error: columnError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'projects'
          ORDER BY ordinal_position;
        `
      });
    
    if (columnError) {
      console.error('❌ 查询表结构失败:', columnError);
    } else {
      console.log('当前projects表结构:');
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // 尝试添加缺失的字段
    console.log('\n🔧 尝试添加缺失字段...');
    
    const fieldsToAdd = [
      {
        name: 'view_count',
        type: 'INTEGER',
        default: '0'
      },
      {
        name: 'reject_reason',
        type: 'TEXT',
        default: null
      },
      {
        name: 'audited_at',
        type: 'TIMESTAMP WITH TIME ZONE',
        default: null
      },
      {
        name: 'images_array',
        type: 'TEXT[]',
        default: "'{}'"
      },
      {
        name: 'category',
        type: 'TEXT',
        default: null
      }
    ];
    
    for (const field of fieldsToAdd) {
      try {
        const addFieldSQL = `ALTER TABLE projects ADD COLUMN IF NOT EXISTS ${field.name} ${field.type}${field.default ? ` DEFAULT ${field.default}` : ''};`;
        
        console.log(`添加字段 ${field.name}...`);
        const { error: addError } = await supabaseAdmin.rpc('exec_sql', { sql: addFieldSQL });
        
        if (addError) {
          console.log(`⚠️  添加${field.name}失败:`, addError.message);
        } else {
          console.log(`✅ 添加${field.name}成功`);
        }
      } catch (err) {
        console.log(`⚠️  添加${field.name}出错:`, err.message);
      }
    }
    
    // 再次检查表结构
    console.log('\n🔍 再次检查表结构...');
    const { data: newColumns, error: newColumnError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .limit(1);
    
    if (newColumnError) {
      console.error('❌ 再次查询失败:', newColumnError);
    } else {
      console.log('查询测试成功，找到字段:', newColumns && newColumns.length > 0 ? Object.keys(newColumns[0]) : '无数据');
    }
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

checkAndFixProjectsTable();