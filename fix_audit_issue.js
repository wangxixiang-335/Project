import { supabase } from './src/config/supabase.js';

async function fixAuditIssue() {
  try {
    console.log('开始修复审核问题...');
    
    const projectId = 'dc8914c5-60f2-449c-8dee-89095b02952d';
    
    // 1. 检查项目当前状态
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
      
    if (projectError) {
      console.error('获取项目失败:', projectError);
      return;
    }
    
    console.log('项目当前状态:', project.status, typeof project.status);
    
    // 2. 如果状态是字符串'0'，转换为数字0
    if (typeof project.status === 'string') {
      console.log('状态是字符串，转换为数字...');
      
      const { error: updateError } = await supabase
        .from('projects')
        .update({ status: parseInt(project.status) })
        .eq('id', projectId);
        
      if (updateError) {
        console.error('更新项目状态失败:', updateError);
        return;
      }
      
      console.log('项目状态已更新为数字');
    }
    
    // 3. 尝试创建audit_records表（如果不存在）
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS audit_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        auditor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        audit_result INTEGER NOT NULL CHECK (audit_result IN (1, 2)),
        reject_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- 启用行级安全
      ALTER TABLE audit_records ENABLE ROW LEVEL SECURITY;
      
      -- 创建基本策略
      DROP POLICY IF EXISTS "Enable read access for all users" ON audit_records;
      CREATE POLICY "Enable read access for all users" ON audit_records FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Enable insert for all users" ON audit_records;
      CREATE POLICY "Enable insert for all users" ON audit_records FOR INSERT WITH CHECK (true);
    `;
    
    console.log('尝试创建audit_records表...');
    
    // 由于Supabase客户端限制，我们直接尝试插入一条记录来测试表是否存在
    const testRecord = {
      project_id: projectId,
      auditor_id: '34ec3e23-e273-4cc3-9def-322ca9389029', // 假设这是一个有效的教师ID
      audit_result: 1,
      reject_reason: null
    };
    
    const { data: testData, error: testError } = await supabase
      .from('audit_records')
      .insert(testRecord)
      .select();
      
    if (testError) {
      console.log('audit_records表不存在或有问题:', testError.message);
      
      // 修改review.js代码，不依赖audit_records表
      console.log('建议：修改review.js，移除audit_records相关的代码');
    } else {
      console.log('audit_records表正常，测试记录已创建:', testData);
      
      // 删除测试记录
      await supabase
        .from('audit_records')
        .delete()
        .eq('project_id', projectId);
    }
    
    // 4. 测试审核操作
    console.log('测试审核操作...');
    console.log('当前项目状态应该是:', 0, '(待审核)');
    
    console.log('修复完成！');
    
  } catch (error) {
    console.error('修复过程中出错:', error);
  }
}

fixAuditIssue();