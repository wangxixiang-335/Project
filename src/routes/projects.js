import express from 'express'
import Joi from 'joi'
import { supabase } from '../config/supabase.js'
import { authenticateToken, requireStudent, requireTeacher } from '../middleware/auth.js'
import { validateRequest, projectCreateSchema, projectUpdateSchema, paginationSchema } from '../middleware/validation.js'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js'
import { PROJECT_STATUS, HTTP_STATUS, ERROR_MESSAGES, FILE_SIZE_LIMITS } from '../config/constants.js'

const router = express.Router()

// 学生提交成果（原项目提交）
router.post('/', 
  authenticateToken, 
  requireStudent, 
  validateRequest(projectCreateSchema), 
  async (req, res) => {
    try {
      console.log('=== 成果提交开始 ===')
      console.log('用户ID:', req.user.id)
      console.log('用户角色:', req.user.role)
      
      const { title, content_html, video_url, category } = req.validatedData
      console.log('提交数据:', { title, content_html: content_html?.substring(0, 100) + '...', video_url, category })
      
      // 从HTML内容中提取图片URL
      const imageUrls = extractImageUrls(content_html)
      console.log('提取的图片URL:', imageUrls)
      
      // 验证图片数量限制
      if (imageUrls.length > FILE_SIZE_LIMITS.MAX_IMAGES_PER_PROJECT) {
        console.log('图片数量超限:', imageUrls.length, '>', FILE_SIZE_LIMITS.MAX_IMAGES_PER_PROJECT)
        return errorResponse(res, ERROR_MESSAGES.PROJECT_LIMIT_EXCEEDED, HTTP_STATUS.BAD_REQUEST)
      }

      // 获取默认成果类型ID
      const { data: defaultType } = await supabase
        .from('achievement_types')
        .select('id')
        .limit(1)
        .single();
      
      const defaultTypeId = defaultType?.id || '00000000-0000-0000-0000-000000000000';

      // 创建成果（原项目）
      console.log('准备创建成果...')
      // 注意：前端将封面图URL放在video_url字段中传递
      const cover_url = video_url || null
      const achievementData = {
        publisher_id: req.user.id,  // 字段名变更：user_id -> publisher_id
        title,
        description: content_html,  // 字段名变更：content_html -> description
        type_id: category || defaultTypeId,  // 字段名变更：category -> type_id
        cover_url: cover_url,  // 使用封面图URL
        video_url: '',  // 视频URL暂时为空
        status: 1,  // 状态值变更：'pending' -> 1 (待审批)
        created_at: new Date().toISOString()
      }
      console.log('成果数据:', achievementData)
      
      const { data: achievement, error } = await supabase
        .from('achievements')  // 表名变更：projects -> achievements
        .insert(achievementData)
        .select()
        .single()

      if (error) {
        console.error('❌ 成果创建错误:', error)
        console.error('错误代码:', error.code)
        console.error('错误消息:', error.message)
        console.error('错误详情:', error.details)
        console.error('错误提示:', error.hint)
        console.error('完整错误对象:', JSON.stringify(error, null, 2))
        return errorResponse(res, `成果提交失败: ${error.message || '数据库错误'}`)
      }

      console.log('✅ 成果创建成功:', achievement)

      // 处理图片附件（新增功能）
      if (imageUrls.length > 0) {
        console.log('处理图片附件...')
        for (let i = 0; i < imageUrls.length; i++) {
          const { error: attachError } = await supabase
            .from('achievement_attachments')
            .insert({
              achievement_id: achievement.id,
              file_name: `image_${i + 1}.jpg`,
              file_url: imageUrls[i],
              file_size: 1024000 // 假设1MB，实际应该获取真实大小
            });
          
          if (attachError) {
            console.warn('附件创建警告:', attachError.message)
          }
        }
      }

      return successResponse(res, {
        project_id: achievement.id,  // 保持返回字段名兼容前端
        status: achievement.status === 1 ? 'pending' : 'unknown'  // 状态值转换回字符串
      }, '成果提交成功', HTTP_STATUS.CREATED)

    } catch (error) {
      console.error('❌ 成果提交错误:', error)
      console.error('错误堆栈:', error.stack)
      return errorResponse(res, '成果提交失败')
    }
  }
)

// 学生修改成果（原项目修改）
router.put('/:id', 
  authenticateToken, 
  requireStudent, 
  validateRequest(projectUpdateSchema), 
  async (req, res) => {
    try {
      const { id } = req.params
      const { title, content_html, video_url, category } = req.validatedData

      // 检查成果是否存在且属于当前用户
      const { data: existingAchievement, error: checkError } = await supabase
        .from('achievements')  // 表名变更：projects -> achievements
        .select('id, status, publisher_id')  // 字段名变更：user_id -> publisher_id
        .eq('id', id)
        .single()

      if (checkError || !existingAchievement) {
        return errorResponse(res, ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
      }

      if (existingAchievement.publisher_id !== req.user.id) {  // 字段名变更
        return errorResponse(res, ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN)
      }

      // 检查成果状态（只能修改待审批或已打回的成果）
      if (![1, 3].includes(existingAchievement.status)) {  // 状态值变更：pending->1, rejected->3
        return errorResponse(res, '只能修改待审批或已打回的项目', HTTP_STATUS.FORBIDDEN)
      }

      // 获取默认成果类型ID
      const { data: defaultType } = await supabase
        .from('achievement_types')
        .select('id')
        .limit(1)
        .single();
      
      const defaultTypeId = defaultType?.id || '00000000-0000-0000-0000-000000000000';

      // 准备更新数据
      const updateData = {}
      if (title) updateData.title = title
      if (content_html) {
        updateData.description = content_html  // 字段名变更：content_html -> description
      }
      if (video_url) updateData.video_url = video_url
      if (category !== undefined) updateData.type_id = category  // 字段名变更：category -> type_id
      
      // 重置为待审批状态
      updateData.status = 1  // 状态值变更：PROJECT_STATUS.PENDING -> 1
      updateData.created_at = new Date().toISOString()  // 更新时间戳

      // 更新成果
      const { data: achievement, error } = await supabase
        .from('achievements')  // 表名变更：projects -> achievements
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('成果修改错误:', error)
        return errorResponse(res, '成果修改失败')
      }

      // 处理图片附件更新（可选功能）
      if (content_html) {
        const imageUrls = extractImageUrls(content_html);
        if (imageUrls.length > 0) {
          // 先删除现有附件
          await supabase
            .from('achievement_attachments')
            .delete()
            .eq('achievement_id', id);
          
          // 添加新附件
          for (let i = 0; i < imageUrls.length; i++) {
            await supabase
              .from('achievement_attachments')
              .insert({
                achievement_id: id,
                file_name: `image_${i + 1}.jpg`,
                file_url: imageUrls[i],
                file_size: 1024000
              });
          }
        }
      }

      return successResponse(res, {
        project_id: achievement.id,  // 保持返回字段名兼容前端
        status: achievement.status === 1 ? 'pending' : 'unknown'  // 状态值转换回字符串
      }, '成果修改成功')

    } catch (error) {
      console.error('成果修改错误:', error)
      return errorResponse(res, '成果修改失败')
    }
  }
)

// 学生获取成果详情（原项目详情）
router.get('/:id', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { id } = req.params

    const { data: achievement, error } = await supabase
      .from('achievements')  // 表名变更：projects -> achievements
      .select(`
        *,
        users:publisher_id (username)  -- 字段名变更：user_id -> publisher_id
      `)
      .eq('id', id)
      .single()

    if (error || !achievement) {
      return errorResponse(res, ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }

    // 检查权限 - 学生只能查看自己的项目
    if (achievement.publisher_id !== req.user.id) {  // 字段名变更
      return errorResponse(res, ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN)
    }

    // 获取附件信息
    const { data: attachments } = await supabase
      .from('achievement_attachments')
      .select('file_url')
      .eq('achievement_id', id);

    const imageUrls = attachments ? attachments.map(att => att.file_url) : [];

    return successResponse(res, {
      ...achievement,
      content_html: achievement.description,  // 字段名转换：description -> content_html
      category: achievement.type_id,  // 字段名转换：type_id -> category
      user_id: achievement.publisher_id,  // 字段名转换：publisher_id -> user_id
      status: achievement.status === 1 ? 'pending' : 
              achievement.status === 2 ? 'approved' : 
              achievement.status === 3 ? 'rejected' : 'pending',  // 状态值转换
      images_array: imageUrls,  // 从附件表重构图片数组
      student_name: achievement.users?.username || '未知用户'
    })

  } catch (error) {
    console.error('获取成果详情错误:', error)
    return errorResponse(res, '获取成果详情失败')
  }
})

// 教师获取成果详情（用于审批）
router.get('/teacher/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params

    const { data: achievement, error } = await supabase
      .from('achievements')
      .select(`
        *,
        users:publisher_id (username)
      `)
      .eq('id', id)
      .single()

    if (error || !achievement) {
      return errorResponse(res, ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }

    // 获取附件信息
    const { data: attachments } = await supabase
      .from('achievement_attachments')
      .select('file_url')
      .eq('achievement_id', id);

    const imageUrls = attachments ? attachments.map(att => att.file_url) : [];

    // 获取审批记录（如果有）
    const { data: approvalRecords } = await supabase
      .from('approval_records')
      .select('reviewer_id, status, feedback, reviewed_at')
      .eq('achievement_id', id)
      .order('reviewed_at', { ascending: false })
      .limit(1);

    const latestApproval = approvalRecords?.[0] || null;

    return successResponse(res, {
      ...achievement,
      content_html: achievement.description,
      category: achievement.type_id,
      status: achievement.status === 1 ? 'pending' : 
              achievement.status === 2 ? 'approved' : 
              achievement.status === 3 ? 'rejected' : 'pending',
      images_array: imageUrls,
      student_name: achievement.users?.username || '未知用户',
      cover_image: imageUrls[0] || null,
      instructor_name: '未指定', // 可以从其他表获取
      project_type: '未分类', // 可以从类型表获取
      latest_review: latestApproval ? {
        reviewer_id: latestApproval.reviewer_id,
        status: latestApproval.status,
        feedback: latestApproval.feedback,
        reviewed_at: latestApproval.reviewed_at
      } : null
    })

  } catch (error) {
    console.error('教师获取成果详情错误:', error)
    return errorResponse(res, '获取成果详情失败')
  }
})

// 学生获取个人成果列表（原项目列表）
router.get('/', authenticateToken, requireStudent, validateRequest(Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  student_id: Joi.string().optional(),
  status: Joi.string().optional().valid('all', 'pending', 'approved', 'rejected')
})), async (req, res) => {
  try {
    const { page, pageSize } = req.validatedData
    const offset = (page - 1) * pageSize

    // 获取成果总数
    const { count, error: countError } = await supabase
      .from('achievements')  // 表名变更：projects -> achievements
      .select('*', { count: 'exact', head: true })
      .eq('publisher_id', req.user.id)  // 字段名变更：user_id -> publisher_id

    if (countError) {
      throw countError
    }

    // 获取成果列表
    const { data: achievements, error } = await supabase
      .from('achievements')  // 表名变更：projects -> achievements
      .select('id, title, status, created_at')  // 注意：可能没有updated_at字段
      .eq('publisher_id', req.user.id)  // 字段名变更：user_id -> publisher_id
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw error
    }

    // 转换数据格式以兼容前端
    const compatibleProjects = (achievements || []).map(achievement => ({
      ...achievement,
      status: achievement.status === 1 ? 'pending' : 
              achievement.status === 2 ? 'approved' : 
              achievement.status === 3 ? 'rejected' : 'pending',  // 状态值转换
      user_id: req.user.id,  // 添加兼容字段
      updated_at: achievement.created_at  // 如果没有updated_at，使用created_at
    }));

    return paginatedResponse(res, compatibleProjects, count || 0, page, pageSize)

  } catch (error) {
    console.error('获取成果列表错误:', error)
    return errorResponse(res, '获取成果列表失败')
  }
})

// 从HTML内容中提取图片URL
function extractImageUrls(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return []
  }
  
  const imageRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi
  const urls = []
  let match
  
  while ((match = imageRegex.exec(htmlContent)) !== null) {
    if (match[1]) {
      urls.push(match[1])
    }
  }
  
  return urls
}

// 教师直接发布成果（无需审批）
router.post('/teacher-publish', 
  authenticateToken, 
  requireTeacher, 
  validateRequest(projectCreateSchema), 
  async (req, res) => {
    try {
      console.log('=== 教师成果直接发布开始 ===')
      console.log('教师ID:', req.user.id)
      console.log('教师角色:', req.user.role)
      
      const { title, content_html, video_url, category } = req.validatedData
      console.log('发布数据:', { title, content_html: content_html?.substring(0, 100) + '...', video_url, category })
      
      // 注意：前端将封面图URL放在video_url字段中传递
      const cover_url = video_url || null
      
      // 从HTML内容中提取图片URL
      const imageUrls = extractImageUrls(content_html)
      console.log('提取的图片URL:', imageUrls)
      
      // 验证图片数量限制
      if (imageUrls.length > FILE_SIZE_LIMITS.MAX_IMAGES_PER_PROJECT) {
        console.log('图片数量超限:', imageUrls.length, '>', FILE_SIZE_LIMITS.MAX_IMAGES_PER_PROJECT)
        return errorResponse(res, ERROR_MESSAGES.PROJECT_LIMIT_EXCEEDED, HTTP_STATUS.BAD_REQUEST)
      }

      // 获取默认成果类型ID
      const { data: defaultType } = await supabase
        .from('achievement_types')
        .select('id')
        .limit(1)
        .single();
      
      const defaultTypeId = defaultType?.id || '00000000-0000-0000-0000-000000000000';

      // 教师直接发布成果，状态为已通过（4）
      console.log('准备创建教师成果...')
      const achievementData = {
        publisher_id: req.user.id,
        title,
        description: content_html,
        type_id: category || defaultTypeId,
        cover_url: cover_url,  // 使用封面图URL
        video_url: '',  // 视频URL暂时为空
        status: 2,  // 状态值：2 表示已通过（根据数据库现有值）
        score: null,
        created_at: new Date().toISOString()
      }
      console.log('成果数据:', achievementData)
      
      const { data: achievement, error } = await supabase
        .from('achievements')
        .insert(achievementData)
        .select()
        .single()

      if (error) {
        console.error('❌ 教师成果发布错误:', error)
        return errorResponse(res, `成果发布失败: ${error.message || '数据库错误'}`)
      }

      console.log('✅ 教师成果发布成功:', achievement)

      // 处理图片附件
      if (imageUrls.length > 0) {
        console.log('处理图片附件...')
        for (let i = 0; i < imageUrls.length; i++) {
          const { error: attachError } = await supabase
            .from('achievement_attachments')
            .insert({
              achievement_id: achievement.id,
              file_name: `image_${i + 1}.jpg`,
              file_url: imageUrls[i],
              file_size: 1024000
            });
          
          if (attachError) {
            console.warn('附件创建警告:', attachError.message)
          }
        }
      }

      // 创建审批记录，标记为已通过
      const { error: auditError } = await supabase
        .from('approval_records')
        .insert({
          achievement_id: achievement.id,
          reviewer_id: req.user.id,  // 教师自己作为审批人
          status: 1,  // 1 表示通过（根据数据库现有值）
          feedback: '',  // 使用feedback字段而不是reject_reason
          reviewed_at: new Date().toISOString()
        });

      if (auditError) {
        console.warn('审批记录创建警告:', auditError.message)
      }

      return successResponse(res, {
        project_id: achievement.id,
        status: 'approved',  // 教师直接发布即为已通过状态
        message: '成果发布成功'
      }, '成果发布成功', HTTP_STATUS.CREATED)

    } catch (error) {
      console.error('❌ 教师成果发布错误:', error)
      console.error('错误堆栈:', error.stack)
      return errorResponse(res, '成果发布失败')
    }
  }
)

// 学生删除成果
router.delete('/:id', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { id } = req.params

    // 检查成果是否存在且属于当前用户
    const { data: existingAchievement, error: checkError } = await supabase
      .from('achievements')
      .select('id, status, publisher_id')
      .eq('id', id)
      .single()

    if (checkError || !existingAchievement) {
      return errorResponse(res, ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }

    if (existingAchievement.publisher_id !== req.user.id) {
      return errorResponse(res, ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN)
    }

    // 检查成果状态（只能删除草稿、待审批或已打回的成果）
    if (![1, 3].includes(existingAchievement.status)) { // pending->1, rejected->3
      return errorResponse(res, '只能删除草稿、待审批或已打回的成果', HTTP_STATUS.FORBIDDEN)
    }

    // 删除相关的附件记录
    const { error: attachmentDeleteError } = await supabase
      .from('achievement_attachments')
      .delete()
      .eq('achievement_id', id)

    if (attachmentDeleteError) {
      console.warn('删除附件失败:', attachmentDeleteError.message)
    }

    // 删除审批记录
    const { error: approvalDeleteError } = await supabase
      .from('approval_records')
      .delete()
      .eq('achievement_id', id)

    if (approvalDeleteError) {
      console.warn('删除审批记录失败:', approvalDeleteError.message)
    }

    // 删除成果
    const { error: deleteError } = await supabase
      .from('achievements')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('删除成果失败:', deleteError)
      return errorResponse(res, '删除成果失败')
    }

    console.log('✅ 成果删除成功:', id)

    return successResponse(res, { achievement_id: id }, '成果删除成功')

  } catch (error) {
    console.error('删除成果错误:', error)
    return errorResponse(res, '删除成果失败')
  }
})

export default router
