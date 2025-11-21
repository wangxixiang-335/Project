import { supabase } from './src/config/supabase.js';

async function getAllTablesSimple() {
  console.log('🔍 获取数据库所有表...\n');
  
  try {
    // 使用SQL查询获取所有表
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });
      
    if (error) {
      console.log('❌ 查询失败:', error.message);
      
      // 如果exec_sql不可用，尝试直接查询一个表来了解结构
      console.log('尝试直接查询已知表来了解数据库结构...');
      
      const knownTables = [
        'users', 'profiles', 'projects', 'achievements', 'classes', 'grades',
        'achievement_types', 'achievement_attachments', 'approval_records', 
        'notifications', 'banners', 'news', 'news_categories', 'knowledge_files',
        'project_reviews', 'audit_records', 'backup_profiles', 'backup_projects'
      ];
      
      const existingTables = [];
      
      for (const tableName of knownTables) {
        try {
          const { data: testData, error: testError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
            
          if (!testError) {
            existingTables.push(tableName);
            console.log(`✅ ${tableName} - 存在`);
          } else {
            console.log(`❌ ${tableName} - 不存在: ${testError.message}`);
          }
        } catch (e) {
          console.log(`❌ ${tableName} - 查询失败`);
        }
      }
      
      return existingTables;
    }
    
    console.log('📋 数据库中的所有表:');
    data.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    return data.map(t => t.table_name);
    
  } catch (error) {
    console.log('❌ 程序错误:', error.message);
    return [];
  }
}

// 检查表是否存在并获取基本信息
async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    if (error) {
      return { exists: false, error: error.message };
    }
    
    return { exists: true, hasData: data && data.length > 0 };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function main() {
  console.log('开始检查数据库表结构...\n');
  
  // 标准表结构（来自PDF）
  const standardTables = [
    'users', 'classes', 'grades', 'achievements', 'achievement_types',
    'achievement_attachments', 'approval_records', 'notifications',
    'banners', 'news', 'news_categories', 'knowledge_files'
  ];
  
  // 已知的其他表
  const otherKnownTables = [
    'profiles', 'projects', 'project_reviews', 'audit_records',
    'backup_profiles', 'backup_projects'
  ];
  
  const allTablesToCheck = [...standardTables, ...otherKnownTables];
  const existingTables = [];
  const missingStandardTables = [];
  const extraTables = [];
  
  console.log('检查标准表结构...');
  for (const tableName of allTablesToCheck) {
    const result = await checkTableExists(tableName);
    
    if (result.exists) {
      existingTables.push(tableName);
      console.log(`✅ ${tableName}`);
    } else {
      if (standardTables.includes(tableName)) {
        missingStandardTables.push(tableName);
        console.log(`❌ ${tableName} (标准表缺失)`);
      } else {
        console.log(`❌ ${tableName} (其他表)`);
      }
    }
    
    // 小延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 检查结果汇总:');
  console.log(`✅ 存在的表: ${existingTables.length}个`);
  console.log(`❌ 缺失的标准表: ${missingStandardTables.length}个`);
  
  if (missingStandardTables.length > 0) {
    console.log('缺失的标准表:', missingStandardTables.join(', '));
  }
  
  // 对比分析
  const standardTablesFound = existingTables.filter(t => standardTables.includes(t));
  const extraTablesFound = existingTables.filter(t => !standardTables.includes(t));
  
  console.log('\n📋 详细分析:');
  console.log('标准表结构中存在的表:', standardTablesFound.join(', '));
  console.log('多余的表（需要删除）:', extraTablesFound.join(', '));
  
  if (extraTablesFound.length > 0) {
    console.log('\n⚠️  发现多余表，建议删除:', extraTablesFound.join(', '));
    
    // 生成删除脚本
    console.log('\n📝 删除多余表的SQL脚本:');
    extraTablesFound.forEach(table => {
      console.log(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    });
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ 程序执行失败:', error);
  process.exit(1);
});