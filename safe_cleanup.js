import { supabase } from './src/config/supabase.js';

async function safeCleanup() {
  console.log('🔧 数据库清理工具 - 安全模式\n');
  
  // 需要删除的多余表
  const tablesToRemove = [
    'profiles',
    'projects', 
    'project_reviews',
    'backup_profiles',
    'backup_projects'
  ];
  
  console.log('📋 准备删除的多余表:');
  tablesToRemove.forEach(table => console.log(`  - ${table}`));
  
  console.log('\n⚠️  警告: 此操作将永久删除这些表及其所有数据!');
  console.log('请确保:');
  console.log('1. 已备份重要数据');
  console.log('2. 确认这些表中的数据不再需要');
  console.log('3. 了解删除后无法恢复\n');
  
  // 首先检查每个表的数据量
  console.log('📊 检查各表数据量...');
  
  for (const tableName of tablesToRemove) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`❌ ${tableName}: 无法查询 - ${error.message}`);
      } else {
        console.log(`📋 ${tableName}: ${count || 0} 条记录`);
      }
    } catch (error) {
      console.log(`❌ ${tableName}: 查询失败 - ${error.message}`);
    }
  }
  
  console.log('\n📝 建议操作步骤:');
  console.log('1. 手动检查这些表是否包含重要数据');
  console.log('2. 如需要，请先备份数据');
  console.log('3. 在 Supabase Dashboard 中执行以下 SQL:');
  console.log('');
  
  // 生成SQL脚本
  console.log('-- 数据库清理脚本 ----------------');
  tablesToRemove.forEach(table => {
    console.log(`DROP TABLE IF EXISTS ${table} CASCADE;`);
  });
  console.log('----------------------------------');
  
  console.log('\n或者使用以下命令逐个删除:');
  console.log('');
  
  // 生成逐个删除的脚本
  for (const tableName of tablesToRemove) {
    console.log(`-- 删除 ${tableName} 表`);
    console.log(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
    console.log('');
  }
  
  console.log('✅ 清理脚本生成完成！');
  console.log('请在 Supabase SQL 编辑器中手动执行上述 SQL 语句。');
  
  // 验证标准表是否完整
  console.log('\n🔍 验证标准表结构完整性...');
  
  const standardTables = [
    'users', 'classes', 'grades', 'achievements', 'achievement_types',
    'achievement_attachments', 'approval_records', 'notifications',
    'banners', 'news', 'news_categories', 'knowledge_files'
  ];
  
  const missingTables = [];
  
  for (const tableName of standardTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        missingTables.push(tableName);
        console.log(`❌ ${tableName}: 缺失`);
      } else {
        console.log(`✅ ${tableName}: 正常`);
      }
    } catch (error) {
      missingTables.push(tableName);
      console.log(`❌ ${tableName}: 错误`);
    }
  }
  
  if (missingTables.length > 0) {
    console.log(`\n⚠️  警告: 发现 ${missingTables.length} 个标准表缺失:`);
    console.log(missingTables.join(', '));
  } else {
    console.log('\n✅ 所有标准表都存在且正常！');
  }
  
  console.log('\n🎉 数据库清理准备工作完成！');
  console.log('请谨慎执行删除操作。');
}

safeCleanup().catch(error => {
  console.error('❌ 程序执行失败:', error);
  process.exit(1);
});