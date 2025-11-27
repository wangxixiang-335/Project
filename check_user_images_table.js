import { supabase } from './src/config/supabase.js';

async function checkUserImagesTable() {
  try {
    console.log('=== 检查user_images表 ===');
    
    // 尝试查询user_images表
    const { data, error } = await supabase
      .from('user_images')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ user_images表不存在或查询失败:', error.message);
      console.log('错误代码:', error.code);
      
      // 尝试获取数据库中的所有表
      console.log('\n=== 获取所有表名 ===');
      const { data: tableData, error: tableError } = await supabase
        .rpc('get_tables');
      
      if (tableError) {
        console.log('获取表列表失败:', tableError.message);
      } else {
        console.log('数据库中的表:', tableData);
      }
      
      return false;
    } else {
      console.log('✅ user_images表存在');
      console.log('表结构数据:', data);
      return true;
    }
    
  } catch (error) {
    console.error('检查失败:', error.message);
    return false;
  }
}

checkUserImagesTable().then(exists => {
  console.log('user_images表存在:', exists);
  process.exit(0);
}).catch(error => {
  console.error('检查过程失败:', error);
  process.exit(1);
});