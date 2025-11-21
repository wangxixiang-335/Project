import { supabase } from './src/config/supabase.js';

async function checkDatabaseStructure() {
  console.log('🔍 检查数据库实际结构...\n');
  
  // 检查projects表结构
  console.log('📋 Projects表结构:');
  try {
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
      
    if (projectError) {
      console.log('❌ Projects表查询失败:', projectError.message);
    } else if (projectData && projectData.length > 0) {
      const columns = Object.keys(projectData[0]);
      console.log('✅ Projects表字段:');
      columns.forEach(col => console.log(`  - ${col}: ${typeof projectData[0][col]}`));
      
      // 检查是否有score字段
      if (columns.includes('score')) {
        console.log('✅ Projects表包含score字段');
      } else {
        console.log('⚠️  Projects表不包含score字段');
      }
    } else {
      console.log('ℹ️  Projects表存在但没有数据');
    }
  } catch (error) {
    console.log('❌ Projects表检查失败:', error.message);
  }
  
  // 检查project_reviews表结构
  console.log('\n📊 Project_reviews表结构:');
  try {
    const { data: reviewData, error: reviewError } = await supabase
      .from('project_reviews')
      .select('*')
      .limit(1);
      
    if (reviewError) {
      console.log('❌ Project_reviews表查询失败:', reviewError.message);
    } else if (reviewData && reviewData.length > 0) {
      const columns = Object.keys(reviewData[0]);
      console.log('✅ Project_reviews表字段:');
      columns.forEach(col => console.log(`  - ${col}: ${typeof reviewData[0][col]}`));
      
      // 检查是否有score字段
      if (columns.includes('score')) {
        console.log('✅ Project_reviews表包含score字段');
      } else {
        console.log('⚠️  Project_reviews表不包含score字段');
      }
    } else {
      console.log('ℹ️  Project_reviews表存在但没有数据');
    }
  } catch (error) {
    console.log('❌ Project_reviews表检查失败:', error.message);
  }
  
  // 检查audit_records表结构
  console.log('\n📋 Audit_records表结构:');
  try {
    const { data: auditData, error: auditError } = await supabase
      .from('audit_records')
      .select('*')
      .limit(1);
      
    if (auditError) {
      console.log('❌ Audit_records表查询失败:', auditError.message);
    } else if (auditData && auditData.length > 0) {
      const columns = Object.keys(auditData[0]);
      console.log('✅ Audit_records表字段:');
      columns.forEach(col => console.log(`  - ${col}: ${typeof auditData[0][col]}`));
    } else {
      console.log('ℹ️  Audit_records表存在但没有数据');
    }
  } catch (error) {
    console.log('❌ Audit_records表检查失败:', error.message);
  }
  
  // 检查profiles表结构
  console.log('\n👤 Profiles表结构:');
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (profileError) {
      console.log('❌ Profiles表查询失败:', profileError.message);
    } else if (profileData && profileData.length > 0) {
      const columns = Object.keys(profileData[0]);
      console.log('✅ Profiles表字段:');
      columns.slice(0, 10).forEach(col => console.log(`  - ${col}: ${typeof profileData[0][col]}`));
      if (columns.length > 10) console.log('  ... (更多字段)');
    } else {
      console.log('ℹ️  Profiles表存在但没有数据');
    }
  } catch (error) {
    console.log('❌ Profiles表检查失败:', error.message);
  }
}

checkDatabaseStructure().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ 数据库检查失败:', error);
  process.exit(1);
});