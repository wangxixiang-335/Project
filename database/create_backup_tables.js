import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function createBackupTables() {
  try {
    console.log('=== 创建备份表 ===');
    
    // 1. 备份 profiles 表
    console.log('正在备份 profiles 表...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
      
    if (!profilesError && profilesData) {
      // 先删除已存在的备份表
      await supabaseAdmin.rpc('drop_backup_table', { table_name: 'backup_profiles' });
      
      // 创建备份表
      const { error: createError } = await supabaseAdmin.rpc('create_backup_profiles_table');
      if (createError) {
        console.log('创建备份表失败，尝试直接插入:', createError.message);
        // 如果存储过程不存在，直接分批插入
        for (const row of profilesData) {
          await supabaseAdmin.from('backup_profiles').insert(row);
        }
      } else {
        console.log('✅ backup_profiles 表创建成功');
      }
      console.log(`✅ 备份了 ${profilesData.length} 条用户记录`);
    } else {
      console.log('❌ 无法读取 profiles 表:', profilesError?.message);
    }
    
    // 2. 备份 projects 表
    console.log('\n正在备份 projects 表...');
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*');
      
    if (!projectsError && projectsData) {
      await supabaseAdmin.rpc('drop_backup_table', { table_name: 'backup_projects' });
      await supabaseAdmin.rpc('create_backup_projects_table');
      console.log(`✅ 备份了 ${projectsData.length} 条项目记录`);
    } else {
      console.log('❌ 无法读取 projects 表:', projectsError?.message);
    }
    
    // 3. 检查 audit_records 表
    console.log('\n检查 audit_records 表...');
    const { data: auditData, error: auditError } = await supabase
      .from('audit_records')
      .select('*');
      
    if (auditError) {
      console.log(`⚠️  audit_records 表不存在: ${auditError.message}`);
      console.log('这很正常，因为审核记录可能还没有创建');
    } else if (auditData) {
      console.log(`✅ audit_records 表存在，有 ${auditData.length} 条记录`);
      // 如果有数据，也创建备份
      await supabaseAdmin.rpc('drop_backup_table', { table_name: 'backup_audit_records' });
      await supabaseAdmin.rpc('create_backup_audit_records_table');
    }
    
    console.log('\n=== 备份完成 ===');
    
  } catch (error) {
    console.error('备份过程出错:', error.message);
  }
}

// 创建备份表函数
async function createBackupFunctions() {
  try {
    console.log('=== 创建备份函数 ===');
    
    // 创建删除备份表的函数
    const { error: dropFuncError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION drop_backup_table(table_name text)
        RETURNS void AS $$
        BEGIN
          EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_name);
        EXCEPTION 
          WHEN others THEN 
            RAISE NOTICE '表 % 不存在或无法删除', table_name;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (dropFuncError) {
      console.log('创建删除函数失败:', dropFuncError.message);
    }
    
    // 为每个表创建备份函数
    const tables = [
      { name: 'profiles', columns: 'id, username, email, role, created_at, updated_at, avatar_url, full_name, phone, bio, is_active' },
      { name: 'projects', columns: 'id, user_id, title, content_html, images_array, video_url, category, status, reject_reason, auditor_id, created_at, updated_at, audited_at' }
    ];
    
    for (const table of tables) {
      const funcName = `create_backup_${table.name}_table`;
      const { error: funcError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION ${funcName}()
          RETURNS void AS $$
          BEGIN
            EXECUTE format('CREATE TABLE backup_${table.name} AS SELECT * FROM ${table.name}');
            RAISE NOTICE '备份表 backup_${table.name} 创建成功';
          EXCEPTION 
            WHEN others THEN 
              RAISE NOTICE '创建备份表失败: %', SQLERRM;
          END;
          $$ LANGUAGE plpgsql;
        `
      });
      
      if (funcError) {
        console.log(`创建 ${funcName} 函数失败:`, funcError.message);
      } else {
        console.log(`✅ 创建 ${funcName} 函数成功`);
      }
    }
    
  } catch (error) {
    console.log('创建函数出错:', error.message);
  }
}

// 主函数
async function main() {
  await createBackupFunctions();
  await createBackupTables();
}

main().catch(console.error);