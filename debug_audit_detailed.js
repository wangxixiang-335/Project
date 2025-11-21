import { supabase } from './src/config/supabase.js';

async function debugAuditDetailed() {
  console.log('🔍 详细调试评审操作...');
  
  try {
    // 1. 检查achievements表结构
    console.log('\n1️⃣ 检查achievements表结构...');
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .limit(1);
    
    if (achievementsError) {
      console.error('❌ achievements表查询失败:', achievementsError);
    } else {
      console.log('✅ achievements表结构:');
      if (achievements && achievements.length > 0) {
        console.log('   字段:', Object.keys(achievements[0]));
        console.log('   示例数据:', achievements[0]);
      }
    }
    
    // 2. 检查approval_records表
    console.log('\n2️⃣ 检查approval_records表...');
    const { data: approvalRecords, error: approvalError } = await supabase
      .from('approval_records')
      .select('*')
      .limit(1);
    
    if (approvalError) {
      if (approvalError.code === 'PGRST204') {
        console.log('⚠️ approval_records表不存在');
      } else {
        console.error('❌ approval_records表查询失败:', approvalError);
      }
    } else {
      console.log('✅ approval_records表存在');
      if (approvalRecords && approvalRecords.length > 0) {
        console.log('   字段:', Object.keys(approvalRecords[0]));
      }
    }
    
    // 3. 测试审核操作的具体步骤
    console.log('\n3️⃣ 测试审核操作步骤...');
    
    // 获取一个待审核的项目
    const { data: pendingProject, error: pendingError } = await supabase
      .from('achievements')
      .select('*')
      .eq('status', 1)
      .limit(1)
      .single();
    
    if (pendingError || !pendingProject) {
      console.error('❌ 没有找到待审核项目:', pendingError);
      return;
    }
    
    console.log('✅ 找到待审核项目:', {
      id: pendingProject.id,
      title: pendingProject.title,
      status: pendingProject.status
    });
    
    // 4. 测试更新achievements表
    console.log('\n4️⃣ 测试更新achievements表...');
    const updateData = {
      status: 2, // 通过
      instructor_id: '4706dd11-ba90-45ec-a4be-c3bb6d19b637' // 教师ID
    };
    
    console.log('   更新数据:', updateData);
    
    const { data: updatedAchievement, error: updateError } = await supabase
      .from('achievements')
      .update(updateData)
      .eq('id', pendingProject.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ 更新achievements失败:', updateError);
      console.error('   错误代码:', updateError.code);
      console.error('   错误详情:', updateError.details);
      console.error('   错误提示:', updateError.hint);
    } else {
      console.log('✅ 更新achievements成功:', updatedAchievement);
    }
    
    // 5. 测试创建approval_records
    console.log('\n5️⃣ 测试创建approval_records...');
    const recordData = {
      achievement_id: pendingProject.id,
      reviewer_id: '4706dd11-ba90-45ec-a4be-c3bb6d19b637',
      status: 1, // 通过
      feedback: null,
      reviewed_at: new Date().toISOString()
    };
    
    console.log('   记录数据:', recordData);
    
    const { data: newRecord, error: recordError } = await supabase
      .from('approval_records')
      .insert(recordData)
      .select()
      .single();
    
    if (recordError) {
      console.error('❌ 创建approval_records失败:', recordError);
      console.error('   错误代码:', recordError.code);
      console.error('   错误详情:', recordError.details);
      console.error('   错误提示:', recordError.hint);
      
      if (recordError.code === 'PGRST204') {
        console.log('🔧 建议创建approval_records表');
      }
    } else {
      console.log('✅ 创建approval_records成功:', newRecord);
    }
    
    // 6. 重置状态测试打回操作
    console.log('\n6️⃣ 重置状态并测试打回操作...');
    await supabase
      .from('achievements')
      .update({ status: 1 })
      .eq('id', pendingProject.id);
    
    const rejectUpdateData = {
      status: 3, // 打回
      instructor_id: '4706dd11-ba90-45ec-a4be-c3bb6d19b637',
      reject_reason: '项目需要进一步完善'
    };
    
    const { data: rejectedAchievement, error: rejectError } = await supabase
      .from('achievements')
      .update(rejectUpdateData)
      .eq('id', pendingProject.id)
      .select()
      .single();
    
    if (rejectError) {
      console.error('❌ 打回更新失败:', rejectError);
    } else {
      console.log('✅ 打回更新成功:', rejectedAchievement);
    }
    
  } catch (error) {
    console.error('❌ 调试过程出错:', error);
  }
}

debugAuditDetailed();