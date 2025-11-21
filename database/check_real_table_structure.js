import { supabase } from './src/config/supabase.js';

async function checkRealTableStructure() {
  try {
    console.log('=== 检查真实的表结构 ===\n');
    
    // 检查achievements表的实际列
    console.log('🔍 检查achievements表的列...');
    const { data: achievementsData, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .limit(1);
    
    if (achievementsError) {
      console.error('❌ 检查achievements表失败:', achievementsError);
    } else {
      if (achievementsData && achievementsData.length > 0) {
        const columns = Object.keys(achievementsData[0]);
        console.log('✅ achievements表的列:', columns);
      } else {
        console.log('ℹ️ achievements表为空，无法确定列结构');
      }
    }
    
    // 检查是否存在updated_at字段
    console.log('\n🔍 测试updated_at字段...');
    const { data: testUpdated, error: updatedError } = await supabase
      .from('achievements')
      .select('id, title, created_at')
      .limit(1);
    
    if (updatedError) {
      console.error('❌ 测试基本字段失败:', updatedError);
    } else {
      console.log('✅ 基本字段测试成功');
    }
    
  } catch (error) {
    console.error('❌ 检查表结构失败:', error.message);
  }
}

checkRealTableStructure();