// 检查achievements表结构
import { supabase } from './src/config/supabase.js';

async function checkTableStructure() {
    console.log('🔍 检查achievements表结构...\n');
    
    try {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('查询失败:', error);
            return;
        }
        
        if (data && data.length > 0) {
            console.log('✅ achievements表字段列表:');
            Object.keys(data[0]).forEach((key, index) => {
                console.log(`${index + 1}. ${key}`);
            });
            console.log('\n📋 示例数据:');
            console.log(JSON.stringify(data[0], null, 2));
        } else {
            console.log('⚠️ achievements表为空，无法检查字段结构');
        }
        
    } catch (e) {
        console.error('连接失败:', e.message);
    }
}

// 运行检查
checkTableStructure().then(() => {
    console.log('\n🏁 表结构检查完成');
    process.exit(0);
}).catch(error => {
    console.error('检查过程中发生错误:', error);
    process.exit(1);
});