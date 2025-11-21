import { supabase } from './src/config/supabase.js';

async function checkAchievementsStructure() {
  console.log('=== 检查achievements表结构 ===\n');
  
  try {
    // 获取表结构
    const { data: columns, error } = await supabase
      .from('achievements')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ 查询表结构失败:', error.message);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ achievements表字段:');
      console.log('字段列表:', Object.keys(columns[0]));
      
      console.log('\n示例数据:');
      console.log(columns[0]);
    } else {
      console.log('ℹ️ 表为空，尝试获取列信息...');
      
      // 尝试插入一条测试数据来获取结构
      const testData = {
        title: '测试',
        description: '测试描述',
        status: 1
      };
      
      const { data: testInsert, error: insertError } = await supabase
        .from('achievements')
        .insert(testData)
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ 插入测试数据失败:', insertError.message);
        console.log('这表明了必需的字段:', insertError.details);
      } else {
        console.log('✅ 成功插入测试数据:');
        console.log('字段列表:', Object.keys(testInsert));
        
        // 删除测试数据
        await supabase
          .from('achievements')
          .delete()
          .eq('id', testInsert.id);
      }
    }
    
    // 检查是否有类型表
    console.log('\n🔍 检查achievement_types表...');
    const { data: types, error: typesError } = await supabase
      .from('achievement_types')
      .select('*')
      .limit(5);
    
    if (typesError) {
      console.log('ℹ️ achievement_types表不存在:', typesError.message);
    } else {
      console.log('✅ achievement_types表存在，类型数据:');
      types.forEach(type => {
        console.log(`  ${type.id}: ${type.name}`);
      });
    }
    
  } catch (error) {
    console.log('❌ 检查表结构异常:', error.message);
  }
}

checkAchievementsStructure().catch(console.error);