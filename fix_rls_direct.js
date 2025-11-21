import { supabaseAdmin } from './src/config/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixRLSDirect() {
  console.log('🛠️ 直接修复RLS无限递归问题...\n');

  try {
    // 1. 首先删除有问题的策略
    console.log('1. 删除有问题的RLS策略...');
    
    const policiesToDelete = [
      '教师可以查看所有用户profile',
      '用户可以查看自己的项目',
      '用户可以管理自己的项目',
      '教师可以查看所有项目'
    ];

    for (const policyName of policiesToDelete) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policyName}" ON profiles;`
        });
        if (error) {
          console.log(`⚠️  删除策略"${policyName}"失败:`, error.message);
        } else {
          console.log(`✅ 删除策略"${policyName}"成功`);
        }
      } catch (err) {
        console.log(`⚠️  删除策略"${policyName}"出错:`, err.message);
      }
    }

    // 2. 重新创建修复后的策略
    console.log('\n2. 创建修复后的RLS策略...');

    // 修复后的教师查看策略 - 避免递归
    const fixTeacherPolicy = `
      DROP POLICY IF EXISTS "教师可以查看所有用户profile" ON profiles;
      CREATE POLICY "教师可以查看所有用户profile" ON profiles
      FOR SELECT USING (
        auth.uid() IN (
          SELECT id FROM profiles WHERE role = 'teacher'
        )
      );
    `;

    console.log('创建教师查看策略...');
    const { error: teacherError } = await supabaseAdmin.rpc('exec_sql', { sql: fixTeacherPolicy });
    if (teacherError) {
      console.log('❌ 教师策略创建失败:', teacherError.message);
    } else {
      console.log('✅ 教师策略创建成功');
    }

    // 3. 修复projects表的策略
    console.log('\n3. 修复projects表策略...');
    
    const fixProjectsPolicies = `
      -- 删除现有策略
      DROP POLICY IF EXISTS "用户可以查看自己的项目" ON projects;
      DROP POLICY IF EXISTS "用户可以管理自己的项目" ON projects;
      DROP POLICY IF EXISTS "教师可以查看所有项目" ON projects;
      
      -- 重新创建策略 - 使用auth.uid()直接比较避免递归
      CREATE POLICY "用户可以查看自己的项目" ON projects
      FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "用户可以管理自己的项目" ON projects
      FOR ALL USING (auth.uid() = user_id);
      
      CREATE POLICY "教师可以查看所有项目" ON projects
      FOR SELECT USING (
        auth.uid() IN (
          SELECT id FROM profiles WHERE role = 'teacher'
        )
      );
    `;

    const { error: projectsError } = await supabaseAdmin.rpc('exec_sql', { sql: fixProjectsPolicies });
    if (projectsError) {
      console.log('❌ projects策略创建失败:', projectsError.message);
    } else {
      console.log('✅ projects策略创建成功');
    }

    // 4. 验证修复结果
    console.log('\n4. 验证修复结果...');
    
    // 测试简单查询
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role')
      .limit(1);
    
    if (testError) {
      console.log('❌ 验证查询失败:', testError.message);
    } else {
      console.log('✅ 验证查询成功，找到', testData?.length || 0, '条记录');
    }

    console.log('\n🎉 RLS修复完成！');

  } catch (error) {
    console.error('❌ RLS修复失败:', error.message);
  }
}

fixRLSDirect();