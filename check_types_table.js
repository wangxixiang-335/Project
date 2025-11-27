// 检查achievement_types表
import { supabase } from './src/config/supabase.js';

async function checkTypesTable() {
    console.log('🔍 检查achievement_types表...\n');
    
    try {
        // 检查表是否存在并获取数据
        const { data, error } = await supabase
            .from('achievement_types')
            .select('*');
        
        if (error) {
            console.error('❌ achievement_types表查询失败:', error);
            console.log('📝 可能需要创建这个表...');
            return;
        }
        
        if (data && data.length > 0) {
            console.log('✅ achievement_types表数据:');
            data.forEach((type, index) => {
                console.log(`${index + 1}. ID: ${type.id}, Name: ${type.name}`);
            });
        } else {
            console.log('⚠️ achievement_types表为空');
            console.log('📝 需要添加类型数据...');
        }
        
        // 检查achievements表中的type_id值
        console.log('\n🔍 检查achievements表中的type_id值...');
        const { data: achievements, error: achievementsError } = await supabase
            .from('achievements')
            .select('type_id')
            .not('type_id', 'is', null);
        
        if (achievementsError) {
            console.error('❌ 查询achievements表失败:', achievementsError);
        } else if (achievements && achievements.length > 0) {
            const uniqueTypeIds = [...new Set(achievements.map(a => a.type_id))];
            console.log('发现type_id值:', uniqueTypeIds);
        }
        
    } catch (e) {
        console.error('连接失败:', e.message);
    }
}

// 运行检查
checkTypesTable().then(() => {
    console.log('\n🏁 表检查完成');
    process.exit(0);
}).catch(error => {
    console.error('检查过程中发生错误:', error);
    process.exit(1);
});