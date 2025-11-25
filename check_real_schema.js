import { supabase } from './src/config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkRealSchema() {
  try {
    console.log('=== 检查真实的数据库架构 ===\n');
    
    // 1. 检查achievements表结构
    console.log('🔍 检查achievements表结构...');
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
        
        // 检查关键字段
        const hasRejectReason = columns.includes('reject_reason');
        const hasInstructorId = columns.includes('instructor_id');
        const hasStatus = columns.includes('status');
        const hasPublisherId = columns.includes('publisher_id');
        
        console.log('关键字段检查:');
        console.log(`  - reject_reason: ${hasRejectReason ? '✅ 存在' : '❌ 不存在'}`);
        console.log(`  - instructor_id: ${hasInstructorId ? '✅ 存在' : '❌ 不存在'}`);
        console.log(`  - status: ${hasStatus ? '✅ 存在' : '❌ 不存在'}`);
        console.log(`  - publisher_id: ${hasPublisherId ? '✅ 存在' : '❌ 不存在'}`);
      } else {
        console.log('ℹ️ achievements表为空，无法确定列结构');
      }
    }
    
    // 2. 检查approval_records表
    console.log('\n🔍 检查approval_records表...');
    const { data: approvalData, error: approvalError } = await supabase
      .from('approval_records')
      .select('*')
      .limit(1);
    
    if (approvalError) {
      console.error('❌ 检查approval_records表失败:', approvalError);
    } else {
      if (approvalData && approvalData.length > 0) {
        const columns = Object.keys(approvalData[0]);
        console.log('✅ approval_records表的列:', columns);
      } else {
        console.log('ℹ️ approval_records表为空或不存在');
      }
    }
    
    // 3. 检查users表
    console.log('\n🔍 检查users表...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, username, email, role')
      .limit(1);
    
    if (usersError) {
      console.error('❌ 检查users表失败:', usersError);
    } else {
      if (usersData && usersData.length > 0) {
        console.log('✅ users表正常，样本数据:', usersData[0]);
      } else {
        console.log('ℹ️ users表为空');
      }
    }
    
    // 4. 测试实际的审批流程
    console.log('\n🧪 测试审批流程...');
    
    // 查找待审核的成果
    const { data: pendingAchievements, error: pendingError } = await supabase
      .from('achievements')
      .select('id, title, status')
      .eq('status', 1)
      .limit(1);
    
    if (pendingError) {
      console.error('❌ 查找待审核成果失败:', pendingError);
    } else {
      if (pendingAchievements && pendingAchievements.length > 0) {
        console.log('✅ 找到待审核成果:', pendingAchievements[0]);
      } else {
        console.log('ℹ️ 没有找到待审核的成果');
      }
    }
    
  } catch (error) {
    console.error('❌ 检查数据库架构失败:', error.message);
  }
}

checkRealSchema();