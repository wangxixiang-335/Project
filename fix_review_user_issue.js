import { replace_in_file } from './fs/promises';

// 修复review.js中的用户ID问题
async function fixReviewUserIssue() {
  try {
    console.log('🔧 修复review.js中的用户ID问题...');
    
    const filePath = './src/routes/review.js';
    
    // 问题1: 在instructor_id设置时直接使用req.user而不是req.user.id
    const fix1 = {
      old: 'if (!testResult.error) {\n          updateData.instructor_id = req.user.id;',
      new: 'if (!testResult.error) {\n          updateData.instructor_id = req.user?.id;'
    };
    
    // 问题2: 在approval_records创建时使用正确的用户ID
    const fix2 = {
      old: 'reviewer_id: req.user.id, // 审批人ID',
      new: 'reviewer_id: req.user?.id, // 审批人ID'
    };
    
    // 问题3: 在旧项目更新中使用正确的用户ID
    const fix3 = {
      old: 'auditor_id: req.user.id,',
      new: 'auditor_id: req.user?.id,'
    };
    
    // 应用修复
    let content = await readFile(filePath, 'utf8');
    
    content = content.replace(fix1.old, fix1.new);
    content = content.replace(fix2.old, fix2.new);
    content = content.replace(fix3.old, fix3.new);
    
    await writeFile(filePath, content, 'utf8');
    
    console.log('✅ 修复完成');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

// 由于fs/promises可能不可用，使用replace_in_file工具
import { replace_in_file } from './tools.js';

async function applyFixes() {
  console.log('🔧 修复review.js中的用户ID问题...');
  
  // 修复1: instructor_id设置
  await replace_in_file('./src/routes/review.js', 
    'if (!testResult.error) {\n          updateData.instructor_id = req.user.id;',
    'if (!testResult.error) {\n          updateData.instructor_id = req.user?.id;'
  );
  
  // 修复2: reviewer_id设置
  await replace_in_file('./src/routes/review.js',
    'reviewer_id: req.user.id, // 审批人ID',
    'reviewer_id: req.user?.id, // 审批人ID'
  );
  
  // 修复3: auditor_id设置
  await replace_in_file('./src/routes/review.js',
    'auditor_id: req.user.id,',
    'auditor_id: req.user?.id,'
  );
  
  console.log('✅ 用户ID问题修复完成');
}

applyFixes();