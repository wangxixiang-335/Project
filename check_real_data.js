// 检查数据库中的真实数据
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

// 尝试从环境变量或直接使用配置
const supabase = createClient(
  process.env.SUPABASE_URL || supabaseUrl,
  process.env.SUPABASE_ANON_KEY || supabaseKey
);

async function checkRealData() {
    console.log('🔍 检查数据库中的真实数据...\n');

    try {
        // 1. 检查 achievements 表
        console.log('📋 检查 achievements 表:');
        const { data: achievements, error: achievementsError } = await supabase
            .from('achievements')
            .select('*')
            .eq('status', 2) // 只看已通过的
            .limit(10);

        if (achievementsError) {
            console.error('❌ achievements 表查询失败:', achievementsError);
        } else {
            console.log(`✅ 找到 ${achievements?.length || 0} 个已通过的成果`);
            achievements?.forEach((achievement, index) => {
                console.log(`  ${index + 1}. ID: ${achievement.id}, 标题: ${achievement.title}, 状态: ${achievement.status}`);
            });
        }

        // 2. 检查 users 表
        console.log('\n👥 检查 users 表:');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, email, role')
            .limit(10);

        if (usersError) {
            console.error('❌ users 表查询失败:', usersError);
        } else {
            console.log(`✅ 找到 ${users?.length || 0} 个用户`);
            users?.forEach((user, index) => {
                console.log(`  ${index + 1}. ID: ${user.id}, 用户名: ${user.username}, 角色: ${user.role}`);
            });
        }

        // 3. 检查是否有其他相关表
        console.log('\n🔍 检查其他可能的成果表:');
        
        // 检查 projects 表
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .limit(5);

        if (projectsError) {
            console.log('ℹ️ projects 表不存在或无权限');
        } else {
            console.log(`✅ projects 表中有 ${projects?.length || 0} 个项目`);
            projects?.forEach((project, index) => {
                console.log(`  ${index + 1}. ID: ${project.id}, 标题: ${project.title}, 状态: ${project.status}`);
            });
        }

        // 4. 检查 achievements 表的字段结构
        console.log('\n🏗️ achievements 表字段结构:');
        const { data: sampleAchievement, error: sampleError } = await supabase
            .from('achievements')
            .select('*')
            .limit(1);

        if (sampleError) {
            console.error('❌ 获取示例数据失败:', sampleError);
        } else if (sampleAchievement && sampleAchievement.length > 0) {
            console.log('字段列表:');
            Object.keys(sampleAchievement[0]).forEach(key => {
                console.log(`  - ${key}: ${typeof sampleAchievement[0][key]} = ${sampleAchievement[0][key]}`);
            });
        }

    } catch (error) {
        console.error('❌ 检查过程中发生错误:', error);
    }
}

checkRealData();