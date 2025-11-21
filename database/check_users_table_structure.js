import { supabase } from './src/config/supabase.js';

async function checkUsersTableStructure() {
  console.log('🔍 检查users表结构...');
  
  try {
    // 1. 获取表结构
    console.log('\n1️⃣ 获取users表结构...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
      .select('*');
    
    if (columnsError) {
      console.error('❌ 获取表结构失败:', columnsError);
      
      // 尝试替代方法
      console.log('\n尝试替代方法获取表数据...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('❌ 获取样本数据失败:', sampleError);
      } else {
        console.log('✅ 获取样本数据成功:', sampleData);
        if (sampleData && sampleData.length > 0) {
          console.log('   字段:', Object.keys(sampleData[0]));
        }
      }
    } else {
      console.log('✅ 表结构:', columns);
    }
    
    // 2. 检查所有用户数据
    console.log('\n2️⃣ 检查所有用户数据...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*');
    
    if (allUsersError) {
      console.error('❌ 获取用户数据失败:', allUsersError);
    } else {
      console.log('✅ 用户总数:', allUsers?.length || 0);
      allUsers?.forEach(user => {
        console.log(`   用户: ${JSON.stringify(user, null, 2)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error);
  }
}

checkUsersTableStructure();