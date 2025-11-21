import { supabase } from './src/config/supabase.js';

async function getTableInfo() {
  try {
    console.log('=== 获取表结构信息 ===');
    
    // 1. 获取 profiles 表的一条数据来查看字段
    console.log('\n1. profiles 表字段分析:');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('❌ 无法获取 profiles 数据:', profileError.message);
    } else if (profileData && profileData.length > 0) {
      console.log('✅ profiles 表字段:');
      const fields = Object.keys(profileData[0]);
      fields.forEach(field => {
        console.log(`   - ${field}: ${typeof profileData[0][field]}`);
      });
      
      // 生成备份SQL
      const fieldList = fields.join(', ');
      console.log('\nprofiles 备份SQL:');
      console.log(`DROP TABLE IF EXISTS backup_profiles;`);
      console.log(`CREATE TABLE backup_profiles AS SELECT ${fieldList} FROM profiles;`);
    }
    
    // 2. 获取 projects 表的一条数据来查看字段
    console.log('\n2. projects 表字段分析:');
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectError) {
      console.log('❌ 无法获取 projects 数据:', projectError.message);
    } else if (projectData && projectData.length > 0) {
      console.log('✅ projects 表字段:');
      const fields = Object.keys(projectData[0]);
      fields.forEach(field => {
        console.log(`   - ${field}: ${typeof projectData[0][field]}`);
      });
      
      // 生成备份SQL
      const fieldList = fields.join(', ');
      console.log('\nprojects 备份SQL:');
      console.log(`DROP TABLE IF EXISTS backup_projects;`);
      console.log(`CREATE TABLE backup_projects AS SELECT ${fieldList} FROM projects;`);
    }
    
    // 3. 检查 audit_records 表
    console.log('\n3. audit_records 表检查:');
    const { data: auditData, error: auditError } = await supabase
      .from('audit_records')
      .select('*')
      .limit(1);
    
    if (auditError) {
      console.log(`⚠️  audit_records 表不存在或无法访问: ${auditError.message}`);
    } else if (auditData && auditData.length > 0) {
      console.log('✅ audit_records 表字段:');
      const fields = Object.keys(auditData[0]);
      fields.forEach(field => {
        console.log(`   - ${field}: ${typeof auditData[0][field]}`);
      });
      
      // 生成备份SQL
      const fieldList = fields.join(', ');
      console.log('\naudit_records 备份SQL:');
      console.log(`DROP TABLE IF EXISTS backup_audit_records;`);
      console.log(`CREATE TABLE backup_audit_records AS SELECT ${fieldList} FROM audit_records;`);
    } else {
      console.log('✅ audit_records 表存在但没有数据');
    }
    
    // 4. 生成完整的备份脚本
    console.log('\n=== 生成的完整备份脚本 ===');
    
    let backupScript = '-- 备份现有数据的SQL脚本\n-- 在Supabase SQL编辑器中运行此脚本\n\n';
    
    if (profileData && profileData.length > 0) {
      const profileFields = Object.keys(profileData[0]).join(', ');
      backupScript += `-- 1. 备份 profiles 表\n`;
      backupScript += `DROP TABLE IF EXISTS backup_profiles;\n`;
      backupScript += `CREATE TABLE backup_profiles AS \n`;
      backupScript += `SELECT ${profileFields} FROM profiles;\n\n`;
    }
    
    if (projectData && projectData.length > 0) {
      const projectFields = Object.keys(projectData[0]).join(', ');
      backupScript += `-- 2. 备份 projects 表\n`;
      backupScript += `DROP TABLE IF EXISTS backup_projects;\n`;
      backupScript += `CREATE TABLE backup_projects AS \n`;
      backupScript += `SELECT ${projectFields} FROM projects;\n\n`;
    }
    
    if (!auditError && auditData) {
      const auditFields = Object.keys(auditData[0]).join(', ');
      backupScript += `-- 3. 备份 audit_records 表\n`;
      backupScript += `DROP TABLE IF EXISTS backup_audit_records;\n`;
      backupScript += `CREATE TABLE backup_audit_records AS \n`;
      backupScript += `SELECT ${auditFields} FROM audit_records;\n\n`;
    }
    
    backupScript += `-- 4. 显示备份结果\n`;
    backupScript += `SELECT 'profiles 表备份完成' as status, COUNT(*) as record_count FROM backup_profiles;\n`;
    backupScript += `SELECT 'projects 表备份完成' as status, COUNT(*) as record_count FROM backup_projects;\n`;
    if (!auditError && auditData) {
      backupScript += `SELECT 'audit_records 表备份完成' as status, COUNT(*) as record_count FROM backup_audit_records;\n`;
    }
    
    console.log(backupScript);
    
    // 保存到文件
    const fs = await import('fs');
    fs.writeFileSync('correct_backup_script.sql', backupScript);
    console.log('\n✅ 备份脚本已保存到 correct_backup_script.sql');
    
  } catch (error) {
    console.error('获取表信息失败:', error.message);
  }
}

getTableInfo().catch(console.error);