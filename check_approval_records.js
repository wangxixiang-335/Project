import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://crwdfiwjfgrfurfhuizk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RmaXdqZmdyZnVyZmh1aXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA2MTA0MywiZXhwIjoyMDc4NjM3MDQzfQ.hFVv7qci6eGYmUT4p8b5ABFHZqdnmk318MIn1O_-ZnY'
);

async function checkApprovalRecords() {
  try {
    console.log('=== 检查审批记录表 ===');
    
    // 检查表结构
    const { data: structure, error: structError } = await supabase
      .from('approval_records')
      .select('*')
      .limit(1);
    
    console.log('表结构检查:', { structure, structError });
    
    // 获取所有审批记录
    const { data: records, error } = await supabase
      .from('approval_records')
      .select('*');
    
    console.log('审批记录总数:', records?.length || 0);
    console.log('审批记录数据:', records);
    console.log('错误:', error);
    
    // 检查教师ID为指定值的记录
    const teacherId = '4706dd11-ba90-45ec-a4be-c3bb6d19b637';
    const { data: teacherRecords, error: teacherError } = await supabase
      .from('approval_records')
      .select('*')
      .eq('reviewer_id', teacherId);
    
    console.log(`教师 ${teacherId} 的审批记录:`, teacherRecords);
    console.log('查询错误:', teacherError);
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkApprovalRecords();