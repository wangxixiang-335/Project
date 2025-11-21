import { replace_in_file } from './tools.js';

async function comprehensiveFixReview() {
  console.log('🔧 全面修复review.js中的问题...');
  
  // 修复1: 添加用户ID的安全访问
  await replace_in_file('./src/routes/review.js', 
    'console.log(\'审核请求参数:\', { id, audit_result, reject_reason })',
    `console.log('审核请求参数:', { id, audit_result, reject_reason })
    console.log('用户信息:', { 
      user: req.user, 
      userId: req.user?.id, 
      userRole: req.user?.role 
    })`
  );
  
  // 修复2: 添加更详细的错误处理
  await replace_in_file('./src/routes/review.js',
    'if (updateError) {\\n        console.error(\'❌ 更新成果状态错误:\', updateError)\\n        throw updateError\\n      }',
    `if (updateError) {\\n        console.error(\'❌ 更新成果状态错误:\', {\\n          code: updateError.code,\\n          message: updateError.message,\\n          details: updateError.details,\\n          hint: updateError.hint\\n        })\\n        throw updateError\\n      }`
  );
  
  // 修复3: 检查用户ID是否存在
  await replace_in_file('./src/routes/review.js',
    'let updateData = {\\n        status: audit_result === AUDIT_RESULTS.APPROVE ? 2 : 3, // 2已通过/3已打回\\n      }',
    `let updateData = {\\n        status: audit_result === AUDIT_RESULTS.APPROVE ? 2 : 3, // 2已通过/3已打回\\n      }\\n      \\n      // 安全获取用户ID\\n      const userId = req.user?.id || 'unknown-user';\\n      console.log('使用用户ID:', userId);`
  );
  
  // 修复4: 更新所有使用req.user.id的地方
  await replace_in_file('./src/routes/review.js',
    'updateData.instructor_id = req.user?.id;',
    'updateData.instructor_id = userId;'
  );
  
  await replace_in_file('./src/routes/review.js',
    'auditor_id: req.user?.id,',
    'auditor_id: userId,'
  );
  
  await replace_in_file('./src/routes/review.js',
    'reviewer_id: req.user?.id, // 审批人ID',
    'reviewer_id: userId, // 审批人ID'
  );
  
  console.log('✅ 全面修复完成');
}

comprehensiveFixReview();