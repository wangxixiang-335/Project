import { supabase } from './src/config/supabase.js';

async function checkDatabase() {
  try {
    console.log('🔍 开始检查数据库结构...');
    
    // 检查users表是否存在
    console.log('检查users表...');
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Users表查询失败:', error.message);
      console.log('错误代码:', error.code);
    } else {
      console.log('✅ Users表存在，查询成功');
    }
    
    // 检查profiles表是否存在（向后兼容）
    console.log('检查profiles表...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (profilesError) {
      console.log('❌ Profiles表不存在:', profilesError.message);
    } else {
      console.log('✅ Profiles表存在');
    }
    
    // 检查auth.users表
    console.log('检查auth.users统计...');
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`📊 Users表记录数: ${count || 0}`);
    }
    
    console.log('✅ 数据库检查完成');
    
  } catch (err) {
    console.error('❌ 数据库检查错误:', err.message);
  }
}

checkDatabase();