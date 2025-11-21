// 删除所有用户数据的脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // 需要使用service key来绕过RLS

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('请确保SUPABASE_URL和SUPABASE_SERVICE_KEY已设置在.env文件中');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllUsers() {
  try {
    console.log('开始删除所有用户数据...');

    // 1. 删除审核记录
    console.log('1. 删除审核记录...');
    const { error: auditError } = await supabase
      .from('audit_records')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有记录
    
    if (auditError) {
      console.error('删除审核记录失败:', auditError);
    } else {
      console.log('✓ 审核记录已删除');
    }

    // 2. 删除浏览记录
    console.log('2. 删除浏览记录...');
    const { error: viewError } = await supabase
      .from('view_records')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (viewError) {
      console.error('删除浏览记录失败:', viewError);
    } else {
      console.log('✓ 浏览记录已删除');
    }

    // 3. 删除项目
    console.log('3. 删除项目...');
    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (projectError) {
      console.error('删除项目失败:', projectError);
    } else {
      console.log('✓ 项目已删除');
    }

    // 4. 删除用户档案
    console.log('4. 删除用户档案...');
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (profileError) {
      console.error('删除用户档案失败:', profileError);
    } else {
      console.log('✓ 用户档案已删除');
    }

    // 5. 验证删除结果
    console.log('\n5. 验证删除结果...');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id');
    const { data: projects, error: prError } = await supabase.from('projects').select('id');
    const { data: audits, error: aError } = await supabase.from('audit_records').select('id');
    const { data: views, error: vError } = await supabase.from('view_records').select('id');

    console.log(`profiles表记录数: ${profiles?.length || 0}`);
    console.log(`projects表记录数: ${projects?.length || 0}`);
    console.log(`audit_records表记录数: ${audits?.length || 0}`);
    console.log(`view_records表记录数: ${views?.length || 0}`);

    console.log('\n✅ 所有用户数据删除完成！');
    console.log('现在可以重新注册之前使用过的邮箱地址了。');

  } catch (error) {
    console.error('删除过程中发生错误:', error);
  }
}

// 执行删除操作
deleteAllUsers();