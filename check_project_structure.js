import { supabase } from './src/config/supabase.js';

async function checkProjectStructure() {
  console.log('🔍 检查projects表实际结构...\n');
  
  try {
    // 获取表结构信息
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('❌ 查询失败:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Projects表字段:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`  - ${col}: ${data[0][col] === null ? 'null' : typeof data[0][col]}`);
      });
      
      // 检查需要的字段
      const requiredFields = ['score', 'feedback', 'reject_reason', 'cover_image'];
      console.log('\n📋 字段检查结果:');
      requiredFields.forEach(field => {
        if (columns.includes(field)) {
          console.log(`  ✅ ${field} 字段存在`);
        } else {
          console.log(`  ❌ ${field} 字段不存在`);
        }
      });
    } else {
      console.log('ℹ️  projects表没有数据，检查表结构...');
    }
    
  } catch (error) {
    console.log('❌ 检查失败:', error.message);
  }
}

checkProjectStructure();