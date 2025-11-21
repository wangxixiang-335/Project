// 修复教师邮箱问题
import { supabase } from './src/config/supabase.js';

async function fixTeacherEmail() {
    try {
        console.log('🔧 修复教师邮箱...');
        
        // 获取第一个教师账户
        const { data: teachers, error: teacherError } = await supabase
            .from('users')
            .select('*')
            .eq('role', 2)
            .limit(1);
            
        if (teacherError || teachers.length === 0) {
            console.error('❌ 没有找到教师账户');
            return;
        }
        
        const teacher = teachers[0];
        console.log('当前教师信息:', teacher);
        
        // 更新教师邮箱
        const newEmail = 'teacherdemo@example.com';
        const { error: updateError } = await supabase
            .from('users')
            .update({ email: newEmail })
            .eq('id', teacher.id);
            
        if (updateError) {
            console.error('❌ 更新邮箱失败:', updateError);
            return;
        }
        
        console.log('✅ 教师邮箱已更新为:', newEmail);
        
        // 重新验证
        const { data: updatedTeacher } = await supabase
            .from('users')
            .select('*')
            .eq('id', teacher.id)
            .single();
            
        console.log('更新后的教师信息:', updatedTeacher);
        
        // 检查登录认证方式
        console.log('
🔍 检查认证相关表...');
        
        // 检查users表结构
        const { data: columns } = await supabase
            .from('users')
            .select('*')
            .limit(1);
            
        console.log('users表的字段:', Object.keys(columns?.[0] || {}));
        
    } catch (error) {
        console.error('❌ 修复失败:', error);
    }
}

fixTeacherEmail();