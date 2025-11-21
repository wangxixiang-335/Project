import { createClient } from '@supabase/supabase-js';

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://crwdfiwjfgrfurhuizk.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RmaXdqZmdyZnVyZmh1aXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjEwNDMsImV4cCI6MjA3ODYzNzA0M30.xJE5RKMkINBpuU0xvMEDWtu78Gl9_SJAEmJJdQ0G4wU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectStatus() {
  console.log('=== 检查项目状态一致性 ===\n');

  // 检查所有项目状态
  console.log('1. 所有项目状态统计:');
  const { data: allProjects, error: allError } = await supabase
    .from('projects')
    .select('id, title, status, created_at, audited_at, auditor_id, reject_reason');

  if (allError) {
    console.error('获取项目列表错误:', allError);
    return;
  }

  const statusCount = allProjects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {});

  console.log('   - 待审核 (0):', statusCount[0] || 0);
  console.log('   - 已通过 (1):', statusCount[1] || 0);
  console.log('   - 已打回 (2):', statusCount[2] || 0);
  console.log('   - 总项目数:', allProjects.length);

  // 检查被标记为已打回但auditor_id为空的项
  console.log('\n2. 检查可疑的已打回项目:');
  const suspiciousRejected = allProjects.filter(p => 
    p.status === 2 && (!p.auditor_id || !p.audited_at)
  );

  console.log('   - 可疑项目数量:', suspiciousRejected.length);
  if (suspiciousRejected.length > 0) {
    console.log('   - 可疑项目详情:');
    suspiciousRejected.forEach(project => {
      console.log(`     ID: ${project.id}, 标题: "${project.title}", 打回时间: ${project.audited_at || '空'}, 审核人ID: ${project.auditor_id || '空'}`);
    });
  }

  // 检查待审核项目
  console.log('\n3. 待审核项目详情:');
  const pendingProjects = allProjects.filter(p => p.status === 0);
  console.log('   - 待审核项目数量:', pendingProjects.length);
  pendingProjects.forEach(project => {
    console.log(`     ID: ${project.id}, 标题: "${project.title}", 提交时间: ${project.created_at}`);
  });

  // 检查已审核项目
  console.log('\n4. 已审核项目详情:');
  const reviewedProjects = allProjects.filter(p => p.status === 1 || p.status === 2);
  console.log('   - 已审核项目数量:', reviewedProjects.length);
  reviewedProjects.forEach(project => {
    const statusText = project.status === 1 ? '已通过' : '已打回';
    console.log(`     ID: ${project.id}, 标题: "${project.title}", 状态: ${statusText}, 审核时间: ${project.audited_at}`);
  });

  // 检查是否有审核记录但没有审核人信息
  console.log('\n5. 检查审核记录一致性:');
  const { data: auditRecords, error: auditError } = await supabase
    .from('audit_records')
    .select('*');

  if (!auditError && auditRecords) {
    console.log('   - 审核记录数量:', auditRecords.length);
    
    // 检查审核记录与项目状态的对应关系
    const auditProjectIds = new Set(auditRecords.map(record => record.project_id));
    const reviewedProjectIds = new Set(reviewedProjects.map(p => p.id));
    
    const missingAuditRecords = reviewedProjects.filter(p => !auditProjectIds.has(p.id));
    const orphanedAuditRecords = auditRecords.filter(record => !reviewedProjectIds.has(record.project_id));
    
    console.log('   - 缺少审核记录的项目:', missingAuditRecords.length);
    console.log('   - 孤立的审核记录:', orphanedAuditRecords.length);
  }

  console.log('\n=== 分析完成 ===');
}

checkProjectStatus().catch(console.error);