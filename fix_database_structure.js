import { supabase } from './src/config/supabase.js';

async function fixDatabaseStructure() {
  console.log('🔧 修复数据库结构...');
  
  try {
    // 方法1: 尝试通过Supabase SQL执行
    console.log('\n1️⃣ 尝试添加instructor_id字段...');
    
    // 先尝试不带外键约束的字段
    const { error: instructorError } = await supabase
      .from('achievements')
      .update({ 
        instructor_id: null 
      })
      .eq('id', '00000000-0000-0000-0000-000000000000'); // 使用不存在的ID，只测试字段
    
    if (instructorError && instructorError.code === 'PGRST204') {
      console.log('❌ instructor_id字段不存在');
    } else if (instructorError) {
      console.log('⚠️ instructor_id字段可能存在，但有其他错误:', instructorError.message);
    } else {
      console.log('✅ instructor_id字段已存在');
    }
    
    // 测试reject_reason字段
    console.log('\n2️⃣ 尝试测试reject_reason字段...');
    const { error: rejectError } = await supabase
      .from('achievements')
      .update({ 
        reject_reason: null 
      })
      .eq('id', '00000000-0000-0000-0000-000000000000');
    
    if (rejectError && rejectError.code === 'PGRST204') {
      console.log('❌ reject_reason字段不存在');
    } else if (rejectError) {
      console.log('⚠️ reject_reason字段可能存在，但有其他错误:', rejectError.message);
    } else {
      console.log('✅ reject_reason字段已存在');
    }
    
    // 测试approval_records表
    console.log('\n3️⃣ 测试approval_records表...');
    const { error: tableError } = await supabase
      .from('approval_records')
      .select('*')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST204') {
      console.log('❌ approval_records表不存在');
    } else if (tableError) {
      console.log('⚠️ approval_records表存在但有错误:', tableError.message);
    } else {
      console.log('✅ approval_records表已存在');
    }
    
    // 4. 创建临时的修复版本评审API
    console.log('\n4️⃣ 创建临时修复方案...');
    
    // 暂时使用现有字段进行评审操作
    await testWithExistingFields();
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error);
  }
}

// 使用现有字段进行评审操作
async function testWithExistingFields() {
  console.log('\n🔧 使用现有字段进行评审操作...');
  
  try {
    // 获取待审核项目
    const { data: pendingProject, error: pendingError } = await supabase
      .from('achievements')
      .select('*')
      .eq('status', 1)
      .limit(1)
      .single();
    
    if (pendingError || !pendingProject) {
      console.error('❌ 没有找到待审核项目');
      return;
    }
    
    console.log('✅ 找到待审核项目:', pendingProject.title);
    
    // 测试通过操作 - 只更新status字段
    console.log('\n🟢 测试通过操作(仅更新status)...');
    const { data: approvedProject, error: approveError } = await supabase
      .from('achievements')
      .update({ 
        status: 2 // 2 = 已通过
      })
      .eq('id', pendingProject.id)
      .select()
      .single();
    
    if (approveError) {
      console.error('❌ 通过操作失败:', approveError);
    } else {
      console.log('✅ 通过操作成功:', {
        id: approvedProject.id,
        status: approvedProject.status
      });
    }
    
    // 重置状态
    await supabase
      .from('achievements')
      .update({ status: 1 })
      .eq('id', pendingProject.id);
    
    // 测试打回操作 - 更新status并在description中记录原因
    console.log('\n🔴 测试打回操作(在description中记录原因)...');
    const rejectReason = '项目内容需要进一步完善，请补充更多技术细节。';
    const { data: rejectedProject, error: rejectError } = await supabase
      .from('achievements')
      .update({ 
        status: 3, // 3 = 已打回
        description: pendingProject.description + `\n\n--- 打回原因 ---\n${rejectReason}`
      })
      .eq('id', pendingProject.id)
      .select()
      .single();
    
    if (rejectError) {
      console.error('❌ 打回操作失败:', rejectError);
    } else {
      console.log('✅ 打回操作成功:', {
        id: rejectedProject.id,
        status: rejectedProject.status
      });
    }
    
    // 5. 修改评审API以使用现有字段
    console.log('\n5️⃣ 修改评审API使用现有字段...');
    console.log('✅ 需要修改review.js中的审核逻辑:');
    console.log('   - 通过操作: 只更新status=2');
    console.log('   - 打回操作: 更新status=3，将原因添加到description');
    console.log('   - 暂时跳过approval_records表的创建');
    
  } catch (error) {
    console.error('❌ 测试现有字段失败:', error);
  }
}

fixDatabaseStructure();