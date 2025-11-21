import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticateToken, requireTeacher } from '../middleware/auth.js'
import { validateRequest, auditSchema, paginationSchema } from '../middleware/validation.js'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js'
import { PROJECT_STATUS, AUDIT_RESULTS, HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js'

const router = express.Router()

// 教师获取待审核成果列表
router.get('/pending', authenticateToken, requireTeacher, validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page, pageSize } = req.validatedData
    const offset = (page - 1) * pageSize

    console.log('📋 获取待审核成果列表 - 参数:', { page, pageSize, offset })

    // 获取待审核成果总数（状态为1表示待审核）
    const { count, error: countError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 1)

    console.log('📊 待审核成果总数查询结果:', { count, countError })

    if (countError) {
      console.error('❌ 获取待审核成果总数错误:', countError)
      throw countError
    }

    // 获取待审核成果列表，关联用户信息
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        created_at,
        users:publisher_id (username)
      `)
      .eq('status', 1)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    console.log('📋 待审核成果列表查询结果:', { achievementsCount: achievements?.length, error })

    if (error) {
      console.error('❌ 获取待审核成果列表错误:', error)
      throw error
    }

    // 格式化响应数据（保持前端兼容）
    const formattedProjects = achievements.map(achievement => ({
      project_id: achievement.id,
      title: achievement.title,
      student_name: achievement.users?.username || '未知用户',
      student_email: '', // 暂时不获取邮箱，避免字段问题
      submitted_at: achievement.created_at
    }))

    console.log('✅ 待审核成果列表格式化完成:', formattedProjects.length, '个项目')

    return paginatedResponse(res, formattedProjects, count, page, pageSize)

  } catch (error) {
    console.error('❌ 获取待审核成果列表错误详情:', {
      message: error.message,
      details: error.details,
      code: error.code,
      hint: error.hint
    })
    return errorResponse(res, `获取待审核成果列表失败: ${error.message}`)
  }
})

// 教师获取审核详情（原项目审核详情）
router.get('/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params

    // 获取成果详情，关联用户信息
    const { data: achievement, error } = await supabase
      .from('achievements')
      .select(`
        *,
        users:publisher_id (username)
      `)
      .eq('id', id)
      .eq('status', 1) // 只获取待审核的成果
      .single()

    if (error || !achievement) {
      return errorResponse(res, ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }

    // 获取附件信息
    const { data: attachments } = await supabase
      .from('achievement_attachments')
      .select('file_url, file_name')
      .eq('achievement_id', id)

    const imageUrls = attachments ? attachments.map(att => att.file_url) : []

    // 获取审批记录信息
    const { data: approvalRecord } = await supabase
      .from('approval_records')
      .select('feedback, reviewed_at')
      .eq('achievement_id', id)
      .single()

    return successResponse(res, {
      ...achievement,
      content_html: achievement.description,  // 字段名转换：description -> content_html
      category: achievement.type_id,  // 字段名转换：type_id -> category
      user_id: achievement.publisher_id,  // 字段名转换：publisher_id -> user_id
      student_name: achievement.users?.username || '未知用户',
      student_email: '', // 暂时不返回邮箱
      images_array: imageUrls,  // 从附件表重构图片数组
      reject_reason: approvalRecord?.feedback || null,  // 审批反馈作为打回原因
      audited_at: approvalRecord?.reviewed_at || null
    })

  } catch (error) {
    console.error('获取审核详情错误:', error)
    return errorResponse(res, '获取审核详情失败')
  }
})

// 教师审核项目
router.post('/:id/audit', authenticateToken, requireTeacher, validateRequest(auditSchema), async (req, res) => {
  try {
    const { id } = req.params
    const { audit_result, reject_reason } = req.validatedData

    console.log('审核请求参数:', { id, audit_result, reject_reason })
    console.log('用户信息:', { 
      user: req.user, 
      userId: req.user?.id, 
      userRole: req.user?.role 
    })

    // 先尝试从projects_view表查找（兼容旧数据）
    let project = null
    let isOldProject = false
    let error = null
    
    const { data: oldProject, error: oldError } = await supabase
      .from('projects_view')
      .select('id, status, title')
      .eq('id', id)
      .eq('status', 'pending') // 字符串状态
      .single()
    
    if (!oldError && oldProject) {
      project = oldProject
      isOldProject = true
      console.log('✅ 找到待审核项目(projects_view):', project)
    } else {
      // 如果projects_view没有找到，尝试从achievements表查找
      const { data: achievement, error: achievementError } = await supabase
        .from('achievements')
        .select('id, status, title')
        .eq('id', id)
        .eq('status', 1) // 1 表示待审核
        .single()
      
      if (!achievementError && achievement) {
        project = achievement
        isOldProject = false
        console.log('✅ 找到待审核成果(achievements):', project)
      } else {
        error = achievementError || oldError
      }
    }

    if (!project) {
      console.log('❌ 项目/成果检查失败:', error?.message || '项目不存在')
      return errorResponse(res, '项目不存在或不是待审核状态', HTTP_STATUS.NOT_FOUND)
    }

    let updatedProject = null
    
    if (isOldProject) {
      // 更新projects_view表（旧数据）
      const updateData = {
        status: audit_result === AUDIT_RESULTS.APPROVE ? 'approved' : 'rejected', // 字符串状态
        auditor_id: userId,
        audited_at: new Date().toISOString()
      }

      if (audit_result === AUDIT_RESULTS.REJECT) {
        updateData.reject_reason = reject_reason
      }

      console.log('📝 更新projects_view数据:', updateData)

      const { data: updated, error: updateError } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ 更新项目状态错误:', updateError)
        throw updateError
      }

      updatedProject = updated
      console.log('✅ 项目更新成功:', updatedProject)
      
    } else {
      // 更新achievements表（新数据）
      let updateData = {
        status: audit_result === AUDIT_RESULTS.APPROVE ? 2 : 3, // 2已通过/3已打回
      }
      
      // 安全获取用户ID
      const userId = req.user?.id || 'unknown-user';
      console.log('使用用户ID:', userId);

      // 添加教师ID（如果字段存在）
      try {
        // 先测试instructor_id字段是否存在
        const testResult = await supabase
          .from('achievements')
          .select('instructor_id')
          .eq('id', id)
          .single();
        
        if (!testResult.error) {
          updateData.instructor_id = userId;
        }
      } catch (testError) {
        console.log('instructor_id字段不存在，跳过设置');
      }

      // 处理打回原因（如果reject_reason字段不存在，添加到description）
      if (audit_result === AUDIT_RESULTS.REJECT) {
        try {
          // 先测试reject_reason字段是否存在
          const testResult = await supabase
            .from('achievements')
            .select('reject_reason')
            .eq('id', id)
            .single();
          
          if (!testResult.error) {
            updateData.reject_reason = reject_reason;
          } else {
            // reject_reason字段不存在，将原因添加到description
            const { data: currentAchievement } = await supabase
              .from('achievements')
              .select('description')
              .eq('id', id)
              .single();
            
            if (currentAchievement) {
              updateData.description = (currentAchievement.description || '') + 
                `

--- 审核打回原因 ---
${reject_reason}`;
            }
          }
        } catch (testError) {
          // 如果测试失败，默认将原因添加到description
          const { data: currentAchievement } = await supabase
            .from('achievements')
            .select('description')
            .eq('id', id)
            .single();
          
          if (currentAchievement) {
            updateData.description = (currentAchievement.description || '') + 
              `

--- 审核打回原因 ---
${reject_reason}`;
          }
        }
      }

      console.log('📝 更新achievements数据:', updateData)

      const { data: updated, error: updateError } = await supabase
        .from('achievements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ 更新成果状态错误:', updateError)
        throw updateError
      }

      updatedProject = updated
      console.log('✅ 成果更新成功:', updatedProject)
    }

    // 创建审批记录（仅对新系统）
    if (!isOldProject) {
      try {
        // 先测试approval_records表是否存在
        const testResult = await supabase
          .from('approval_records')
          .select('id')
          .limit(1);
        
        if (!testResult.error) {
          const { error: recordError } = await supabase
            .from('approval_records')
            .insert({
              achievement_id: id,
              reviewer_id: userId, // 审批人ID
              status: audit_result === AUDIT_RESULTS.APPROVE ? 1 : 0, // 1通过/0驳回
              feedback: audit_result === AUDIT_RESULTS.REJECT ? reject_reason : null, // 打回原因作为反馈
              reviewed_at: new Date().toISOString()
            });

          if (recordError) {
            console.error('创建审批记录错误:', recordError)
            console.log('审批记录创建失败，但审核操作已成功')
          } else {
            console.log('✅ 审批记录创建成功')
          }
        } else {
          console.log('approval_records表不存在，跳过创建审批记录')
        }
      } catch (error) {
        console.error('创建审批记录异常:', error)
        console.log('审批记录创建失败，但审核操作已成功')
      }
    }

    const message = audit_result === AUDIT_RESULTS.APPROVE ? '项目审核通过' : '项目审核不通过'

    return successResponse(res, {
      project_id: updatedProject.id,
      status: updatedProject.status,
      audit_result,
      reject_reason: audit_result === AUDIT_RESULTS.REJECT ? reject_reason : null
    }, message)

  } catch (error) {
    console.error('❌ 审核成果错误:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return errorResponse(res, `审核成果失败: ${error.message || '未知错误'}`)
  }
})

// 教师获取审核历史记录
router.get('/history/list', authenticateToken, requireTeacher, validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page, pageSize } = req.validatedData
    const offset = (page - 1) * pageSize

    console.log('📜 获取审核历史 - 参数:', { page, pageSize, offset })

    // 获取已审核成果总数（状态为2或3）
    const { count, error: countError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .in('status', [2, 3]) // 2=已通过, 3=已打回

    console.log('📊 已审核成果总数:', { count, countError })

    if (countError) {
      throw countError
    }

    // 获取已审核成果列表，先不关联审批记录，避免复杂的关联查询
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        status,
        created_at,
        users:publisher_id (username)
      `)
      .in('status', [2, 3])
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    console.log('📋 已审核成果列表:', { achievementsCount: achievements?.length, error })

    if (error) {
      throw error
    }

    // 获取这些成果的审批记录
    const achievementIds = achievements?.map(a => a.id) || []
    let approvalRecords = []
    
    if (achievementIds.length > 0) {
      const { data: approvals, error: approvalError } = await supabase
        .from('approval_records')
        .select('achievement_id, feedback, reviewed_at, reviewer_id')
        .in('achievement_id', achievementIds)
      
      if (!approvalError) {
        approvalRecords = approvals
      }
    }

    // 创建审批记录映射
    const approvalMap = {}
    approvalRecords.forEach(approval => {
      approvalMap[approval.achievement_id] = approval
    })

    // 获取审批人信息
    const reviewerIds = approvalRecords.map(a => a.reviewer_id).filter(Boolean)
    let reviewers = []
    
    if (reviewerIds.length > 0) {
      const { data: reviewerData, error: reviewerError } = await supabase
        .from('users')
        .select('id, username')
        .in('id', reviewerIds)
      
      if (!reviewerError) {
        reviewers = reviewerData
      }
    }

    // 创建审批人映射
    const reviewerMap = {}
    reviewers.forEach(reviewer => {
      reviewerMap[reviewer.id] = reviewer.username
    })

    // 格式化响应数据
    const formattedHistory = achievements?.map(achievement => {
      const approval = approvalMap[achievement.id]
      return {
        project_id: achievement.id,
        title: achievement.title,
        student_name: achievement.users?.username || '未知用户',
        status: achievement.status,
        reject_reason: approval?.feedback || null,
        submitted_at: achievement.created_at,
        audited_at: approval?.reviewed_at || null,
        auditor_name: approval?.reviewer_id ? reviewerMap[approval.reviewer_id] || '未知教师' : null
      }
    }) || []

    console.log('✅ 审核历史格式化完成:', formattedHistory.length, '条记录')

    return paginatedResponse(res, formattedHistory, count, page, pageSize)

  } catch (error) {
    console.error('❌ 获取审核历史错误详情:', {
      message: error.message,
      details: error.details,
      code: error.code,
      hint: error.hint
    })
    return errorResponse(res, `获取审核历史失败: ${error.message}`)
  }
})

// 教师筛选审核历史（按审核结果）
router.get('/history/filter', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { audit_result, page = 1, pageSize = 10 } = req.query
    const offset = (page - 1) * pageSize

    // 根据审核结果筛选状态
    let statusFilter = [2, 3] // 2=已通过, 3=已打回
    if (audit_result === '1') {
      statusFilter = [2] // 只显示已通过
    } else if (audit_result === '2') {
      statusFilter = [3] // 只显示已打回
    }

    // 获取筛选后的总数
    const { count, error: countError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .in('status', statusFilter)

    if (countError) {
      throw countError
    }

    // 获取筛选后的列表，关联审批记录
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        status,
        created_at,
        users:publisher_id (username),
        approval_records!inner (
          feedback,
          reviewed_at,
          reviewer_id
        )
      `)
      .in('status', statusFilter)
      .order('approval_records.reviewed_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw error
    }

    // 获取审批人信息
    const reviewerIds = achievements?.map(a => a.approval_records?.[0]?.reviewer_id).filter(Boolean) || []
    const { data: reviewers } = reviewerIds.length > 0 ? await supabase
      .from('users')
      .select('id, username')
      .in('id', reviewerIds) : { data: [] }

    // 创建审批人映射
    const reviewerMap = {}
    reviewers?.forEach(reviewer => {
      reviewerMap[reviewer.id] = reviewer.username
    })

    const formattedHistory = achievements?.map(achievement => {
      const approval = achievement.approval_records?.[0]
      return {
        project_id: achievement.id,
        title: achievement.title,
        student_name: achievement.users?.username || '未知用户',
        status: achievement.status,
        reject_reason: approval?.feedback || null,
        submitted_at: achievement.created_at,
        audited_at: approval?.reviewed_at || null,
        auditor_name: approval?.reviewer_id ? reviewerMap[approval.reviewer_id] || '未知教师' : null
      }
    }) || []

    return paginatedResponse(res, formattedHistory, count, parseInt(page), parseInt(pageSize))

  } catch (error) {
    console.error('筛选审核历史错误:', error)
    return errorResponse(res, '筛选审核历史失败')
  }
})

export default router