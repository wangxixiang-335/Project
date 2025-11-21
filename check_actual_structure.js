import { supabase } from './src/config/supabase.js';

async function checkActualTableStructure() {
  try {
    console.log('=== 检查实际表结构 ===');
    
    // 检查 profiles 表结构
    console.log('\n1. profiles 表结构:');
    const { data: profilesCols, error: profilesError } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' });
    
    if (profilesError) {
      console.log('❌ 无法获取 profiles 表结构:', profilesError.message);
    } else {
      console.log('✅ profiles 表字段:');
      profilesCols.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // 检查 projects 表结构
    console.log('\n2. projects 表结构:');
    const { data: projectsCols, error: projectsError } = await supabase
      .rpc('get_table_columns', { table_name: 'projects' });
    
    if (projectsError) {
      console.log('❌ 无法获取 projects 表结构:', projectsError.message);
    } else {
      console.log('✅ projects 表字段:');
      projectsCols.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // 检查 audit_records 表结构
    console.log('\n3. audit_records 表结构:');
    const { data: auditCols, error: auditError } = await supabase
      .rpc('get_table_columns', { table_name: 'audit_records' });
    
    if (auditError) {
      console.log('⚠️  audit_records 表不存在或无法获取结构:', auditError.message);
    } else {
      console.log('✅ audit_records 表字段:');
      auditCols.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // 生成正确的备份SQL
    console.log('\n=== 生成正确的备份SQL ===');
    
    if (profilesCols) {
      const profileFields = profilesCols.map(col => col.column_name).join(', ');
      console.log('\nprofiles 表备份SQL:');
      console.log(`DROP TABLE IF EXISTS backup_profiles;`);
      console.log(`CREATE TABLE backup_profiles AS SELECT ${profileFields} FROM profiles;`);
    }
    
    if (projectsCols) {
      const projectFields = projectsCols.map(col => col.column_name).join(', ');
      console.log('\nprojects 表备份SQL:');
      console.log(`DROP TABLE IF EXISTS backup_projects;`);
      console.log(`CREATE TABLE backup_projects AS SELECT ${projectFields} FROM projects;`);
    }
    
  } catch (error) {
    console.error('检查表结构失败:', error.message);
  }
}

// 创建获取表结构的函数
async function createGetTableColumnsFunction() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
        RETURNS TABLE(column_name text, data_type text) 
        AS $$
        BEGIN
          RETURN QUERY 
          SELECT c.column_name::text, c.data_type::text
          FROM information_schema.columns c
          WHERE c.table_name = $1 
          AND c.table_schema = 'public'
          ORDER BY c.ordinal_position;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (error) {
      console.log('创建函数失败，尝试直接查询:');
      // 如果函数创建失败，直接查询information_schema
      return false;
    }
    return true;
  } catch (err) {
    console.log('创建函数出错:', err.message);
    return false;
  }
}

// 备用方法：直接查询表结构
async function checkStructureDirectly() {
  try {
    console.log('=== 直接查询表结构 ===');
    
    const tables = ['profiles', 'projects', 'audit_records'];
    
    for (const table of tables) {
      console.log(`\n${table} 表结构:`);
      
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', table)
        .order('ordinal_position');
      
      if (error) {
        console.log(`❌ 无法获取 ${table} 表结构: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`✅ ${table} 表字段:`);
        data.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
        });
        
        // 生成备份SQL
        const fields = data.map(col => col.column_name).join(', ');
        console.log(`\n备份SQL:`);
        console.log(`DROP TABLE IF EXISTS backup_${table};`);
        console.log(`CREATE TABLE backup_${table} AS SELECT ${fields} FROM ${table};`);
      } else {
        console.log(`⚠️  ${table} 表不存在或没有字段`);
      }
    }
    
  } catch (error) {
    console.error('直接查询失败:', error.message);
  }
}

// 主函数
async function main() {
  const functionCreated = await createGetTableColumnsFunction();
  
  if (functionCreated) {
    await checkActualTableStructure();
  } else {
    await checkStructureDirectly();
  }
}

main().catch(console.error);