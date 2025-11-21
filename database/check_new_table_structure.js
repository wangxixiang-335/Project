import { supabase } from './src/config/supabase.js';

async function checkNewTableStructure() {
  try {
    console.log('=== 检查新创建的表结构 ===');
    
    const tables = ['users', 'achievements', 'achievement_attachments', 'approval_records'];
    
    for (const table of tables) {
      console.log(`\n${table} 表结构:`);
      
      try {
        // 获取表的一条数据来查看字段
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ 无法获取 ${table} 数据: ${error.message}`);
        } else if (data && data.length > 0) {
          console.log('✅ 字段列表:');
          const fields = Object.keys(data[0]);
          fields.forEach(field => {
            console.log(`   - ${field}: ${typeof data[0][field]}`);
          });
          
          // 生成正确的INSERT语句
          const fieldList = fields.join(', ');
          console.log(`\n正确的INSERT语句:`);
          console.log(`INSERT INTO ${table} (${fieldList}) VALUES (...);`);
        } else {
          console.log(`✅ ${table} 表存在但没有数据`);
          
          // 尝试获取表结构信息
          const { data: emptyData, error: emptyError } = await supabase
            .from(table)
            .select('*');
          
          if (!emptyError) {
            console.log('字段信息不可用，表可能为空');
          }
        }
      } catch (err) {
        console.log(`❌ 检查 ${table} 时出错: ${err.message}`);
      }
    }
    
    // 检查备份表结构对比
    console.log('\n=== 对比备份表和新表结构 ===');
    
    // 检查 backup_profiles
    console.log('\nbackup_profiles vs users:');
    const { data: backupProfileData } = await supabase
      .from('backup_profiles')
      .select('*')
      .limit(1);
    
    if (backupProfileData && backupProfileData.length > 0) {
      console.log('backup_profiles 字段:', Object.keys(backupProfileData[0]).join(', '));
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (userData && userData.length > 0) {
      console.log('users 字段:', Object.keys(userData[0]).join(', '));
    }
    
    // 生成修正的迁移脚本
    console.log('\n=== 生成修正的迁移脚本 ===');
    
    if (backupProfileData && backupProfileData.length > 0 && userData && userData.length > 0) {
      const backupFields = Object.keys(backupProfileData[0]);
      const userFields = Object.keys(userData[0]);
      
      // 找到共同字段
      const commonFields = backupFields.filter(field => userFields.includes(field));
      const missingFields = userFields.filter(field => !backupFields.includes(field));
      
      console.log('\n共同字段（可以迁移）:', commonFields.join(', '));
      console.log('缺失字段（需要处理）:', missingFields.join(', '));
      
      // 生成修正的INSERT语句
      if (commonFields.length > 0) {
        console.log('\n修正的用户数据迁移SQL:');
        console.log(`INSERT INTO users (${commonFields.join(', ')})`);
        console.log(`SELECT ${commonFields.join(', ')} FROM backup_profiles;`);
        
        // 处理缺失字段
        if (missingFields.length > 0) {
          console.log('\n缺失字段处理建议:');
          missingFields.forEach(field => {
            switch(field) {
              case 'password_hash':
                console.log(`  ${field}: 需要添加默认值或使用Supabase Auth集成`);
                break;
              case 'class_id':
                console.log(`  ${field}: 可以设置为NULL或关联到默认班级`);
                break;
              default:
                console.log(`  ${field}: 可以设置为NULL或默认值`);
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('检查表结构失败:', error.message);
  }
}

checkNewTableStructure().catch(console.error);