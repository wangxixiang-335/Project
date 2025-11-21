import express from 'express';
import { supabase } from './src/config/supabase.js';
import { validateRequest, auditSchema } from './src/middleware/validation.js';
import { successResponse, errorResponse } from './src/utils/response.js';
import { AUDIT_RESULTS } from './src/config/constants.js';

const router = express.Router();

// 添加详细的评审调试接口
router.post('/:id/audit-debug', validateRequest(auditSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { audit_result, reject_reason } = req.validatedData;

    console.log('🔍 调试评审操作开始...');
    console.log('📋 输入参数:', { id, audit_result, reject_reason });
    console.log('👤 用户信息:', { 
      id: req.user?.id, 
      email: req.user?.email,
      role: req.user?.role 
    });

    // 步骤1: 检查项目是否存在
    console.log('\n📋 步骤1: 检查项目是否存在...');
    const { data: achievement, error: checkError } = await supabase
      .from('achievements')
      .select('id, status, title')
      .eq('id', id)
      .eq('status', 1)
      .single();

    if (checkError || !achievement) {
      console.log('❌ 项目检查失败:', checkError?.message || '项目不存在');
      return errorResponse(res, '项目不存在或不是待审核状态', 404);
    }

    console.log('✅ 项目检查成功:', achievement);

    // 步骤2: 准备更新数据
    console.log('\n📋 步骤2: 准备更新数据...');
    let updateData = {
      status: audit_result === AUDIT_RESULTS.APPROVE ? 2 : 3
    };
    console.log('📝 基础更新数据:', updateData);

    // 步骤3: 测试字段并添加教师信息
    console.log('\n📋 步骤3: 测试instructor_id字段...');
    try {
      const testResult = await supabase
        .from('achievements')
        .select('instructor_id')
        .eq('id', id)
        .single();
      
      if (!testResult.error && testResult.data) {
        updateData.instructor_id = req.user?.id || 'test-user-id';
        console.log('✅ instructor_id字段存在，已添加到更新数据');
      } else {
        console.log('⚠️ instructor_id字段不存在，跳过');
      }
    } catch (testError) {
      console.log('⚠️ 测试instructor_id字段异常:', testError.message);
    }

    // 步骤4: 处理打回原因
    if (audit_result === AUDIT_RESULTS.REJECT) {
      console.log('\n📋 步骤4: 处理打回原因...');
      try {
        const testResult = await supabase
          .from('achievements')
          .select('reject_reason')
          .eq('id', id)
          .single();
        
        if (!testResult.error && testResult.data) {
          updateData.reject_reason = reject_reason;
          console.log('✅ reject_reason字段存在，直接设置');
        } else {
          console.log('⚠️ reject_reason字段不存在，添加到description');
          const { data: currentAchievement } = await supabase
            .from('achievements')
            .select('description')
            .eq('id', id)
            .single();
          
          if (currentAchievement) {
            updateData.description = (currentAchievement.description || '') + 
              `\n\n--- 审核打回原因 ---\n${reject_reason}`;
            console.log('✅ 已将打回原因添加到description');
          }
        }
      } catch (testError) {
        console.log('⚠️ 处理reject_reason异常:', testError.message);
        // 默认添加到description
        const { data: currentAchievement } = await supabase
          .from('achievements')
          .select('description')
          .eq('id', id)
          .single();
        
        if (currentAchievement) {
          updateData.description = (currentAchievement.description || '') + 
            `\n\n--- 审核打回原因 ---\n${reject_reason}`;
        }
      }
    }

    console.log('📝 最终更新数据:', updateData);

    // 步骤5: 执行数据库更新
    console.log('\n📋 步骤5: 执行数据库更新...');
    const { data: updated, error: updateError } = await supabase
      .from('achievements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 数据库更新失败:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      });
      throw updateError;
    }

    console.log('✅ 数据库更新成功:', updated);

    // 步骤6: 创建审批记录（可选）
    console.log('\n📋 步骤6: 创建审批记录...');
    try {
      const testResult = await supabase
        .from('approval_records')
        .select('id')
        .limit(1);
      
      if (!testResult.error) {
        const { error: recordError } = await supabase
          .from('approval_records')
          .insert({
            achievement_id: id,
            reviewer_id: req.user?.id || 'test-user-id',
            status: audit_result === AUDIT_RESULTS.APPROVE ? 1 : 0,
            feedback: audit_result === AUDIT_RESULTS.REJECT ? reject_reason : null,
            reviewed_at: new Date().toISOString()
          });

        if (recordError) {
          console.log('⚠️ 创建审批记录失败:', recordError.message);
        } else {
          console.log('✅ 审批记录创建成功');
        }
      } else {
        console.log('⚠️ approval_records表不存在，跳过创建');
      }
    } catch (error) {
      console.log('⚠️ 创建审批记录异常:', error.message);
    }

    // 步骤7: 返回成功响应
    const message = audit_result === AUDIT_RESULTS.APPROVE ? '项目审核通过' : '项目审核不通过';
    console.log('\n🎉 评审操作完成:', message);

    return successResponse(res, {
      project_id: updated.id,
      status: updated.status,
      audit_result,
      reject_reason: audit_result === AUDIT_RESULTS.REJECT ? reject_reason : null
    }, message);

  } catch (error) {
    console.error('❌ 评审操作异常:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return errorResponse(res, '审核成果失败');
  }
});

export default router;