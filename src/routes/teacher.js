import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticateToken, requireTeacher } from '../middleware/auth.js'
import { validateRequest, paginationSchema } from '../middleware/validation.js'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js'
import { PROJECT_STATUS, HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js'

const router = express.Router()

// 项目类型映射函数
const getProjectType = (typeId) => {
  const typeMap = {
    '2dc62667-7b1d-443b-9315-1dfd89c83f21': '项目',
    '5f18c811-0a39-465b-ab4f-5db179deeed6': '论文',
    'ece36ff7-1bd5-4a81-a2a7-59fa0722cb07': '软件作品'
  }
  return typeMap[typeId] || '未分类'
}

// 教师获取所有项目列表
router.get('/projects', authenticateToken, requireTeacher, validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page, pageSize } = req.validatedData
    const offset = (page - 1) * pageSize

    // 使用 achievements 表获取所有成果总数
    const { count, error: countError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw countError
    }

    // 获取所有成果列表，关联用户信息
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        status,
        created_at,
        users:publisher_id (username)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw error
    }

    // 获取审批记录信息
    const achievementIds = achievements.map(a => a.id)
    const { data: approvalRecords } = await supabase
      .from('approval_records')
      .select('achievement_id, reviewed_at, feedback')
      .in('achievement_id', achievementIds)

    // 创建审批记录映射
    const approvalMap = {}
    approvalRecords?.forEach(record => {
      approvalMap[record.achievement_id] = record
    })

    // 格式化响应数据
    const formattedProjects = achievements.map(achievement => {
      const approval = approvalMap[achievement.id]
      let statusText = '未知'
      switch (achievement.status) {
        case 1:
          statusText = '待审核'
          break
        case 2:
          statusText = '已通过'
          break
        case 3:
          statusText = '已打回'
          break
        default:
          statusText = '未知'
      }
      return {
        project_id: achievement.id,
        title: achievement.title,
        student_name: achievement.users?.username || '未知用户',
        status: achievement.status,
        status_text: statusText,
        submitted_at: achievement.created_at,
        audited_at: approval?.reviewed_at || null
      }
    })

    return paginatedResponse(res, formattedProjects, count, page, pageSize)

  } catch (error) {
    console.error('获取所有项目列表错误:', error)
    return errorResponse(res, '获取项目列表失败')
  }
})

// 教师获取待审核项目列表
router.get('/pending-projects', authenticateToken, requireTeacher, validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page, pageSize } = req.validatedData
    const offset = (page - 1) * pageSize

    // 获取待审核成果总数（状态为1表示待审核）
    const { count, error: countError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 1) // 1 表示待审核

    if (countError) {
      console.error('获取待审核项目总数错误:', countError)
      throw countError
    }

    // 获取待审核成果列表，关联用户信息和附件
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        description,
        video_url,
        created_at,
        users:publisher_id (username)
      `)
      .eq('status', 1) // 1 表示待审核
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('获取待审核项目列表错误:', error)
      throw error
    }

    console.log('待审核项目查询结果:', { count, achievements: achievements?.length, error })

    // 获取附件信息
    const achievementIds = achievements?.map(a => a.id) || []
    const { data: attachments } = achievementIds.length > 0 ? await supabase
      .from('achievement_attachments')
      .select('achievement_id, file_url')
      .in('achievement_id', achievementIds) : { data: [] }

    // 创建附件映射
    const attachmentMap = {}
    attachments?.forEach(att => {
      if (!attachmentMap[att.achievement_id]) {
        attachmentMap[att.achievement_id] = []
      }
      attachmentMap[att.achievement_id].push(att.file_url)
    })

    // 格式化响应数据
    const formattedProjects = achievements?.map(achievement => ({
      id: achievement.id,
      project_id: achievement.id,
      title: achievement.title,
      content_html: achievement.description,
      video_url: achievement.video_url,
      images_array: attachmentMap[achievement.id] || [],
      student_name: achievement.users?.username || '未知用户',
      submitted_at: achievement.created_at
    })) || []

    return paginatedResponse(res, formattedProjects, count, page, pageSize)

  } catch (error) {
    console.error('获取待审核项目列表错误详情:', {
      message: error.message,
      details: error.details,
      code: error.code
    })
    return errorResponse(res, `获取待审核项目列表失败: ${error.message}`)
  }
})

// 教师获取统计信息
router.get('/stats', authenticateToken, requireTeacher, async (req, res) => {
  try {
    // 获取总成果数量
    const { count: total, error: totalError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      throw totalError
    }

    // 获取待审核成果数量（状态为1）
    const { count: pending, error: pendingError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 1)

    if (pendingError) {
      throw pendingError
    }

    // 获取已通过成果数量（状态为2）
    const { count: approved, error: approvedError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 2)

    if (approvedError) {
      throw approvedError
    }

    // 获取已打回成果数量（状态为3）
    const { count: rejected, error: rejectedError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 3)

    if (rejectedError) {
      throw rejectedError
    }

    const stats = {
      total: total || 0,
      pending: pending || 0,
      approved: approved || 0,
      rejected: rejected || 0
    }

    return successResponse(res, stats)

  } catch (error) {
    console.error('获取统计信息错误:', error)
    return errorResponse(res, '获取统计信息失败')
  }
})

// 获取教师用户列表（用于指导老师选择）
router.get('/instructors', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { data: instructors, error } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('role', 2) // role为2表示教师
      .order('username', { ascending: true })

    if (error) {
      throw error
    }

    return successResponse(res, instructors || [])

  } catch (error) {
    console.error('获取教师列表错误:', error)
    return errorResponse(res, '获取教师列表失败')
  }
})

// 获取教师个人的项目列表
router.get('/my-projects', authenticateToken, requireTeacher, validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page, pageSize } = req.validatedData
    const offset = (page - 1) * pageSize
    const teacherId = req.user.id

    console.log('🔍 获取教师个人成果，教师ID:', teacherId)

    // 获取教师发布的成果总数
    const { count, error: countError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('publisher_id', teacherId)

    if (countError) {
      throw countError
    }

    console.log('📊 教师个人成果总数:', count)

    // 获取教师发布的成果列表
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        description,
        type_id,
        status,
        score,
        publisher_id,
        instructor_id,
        created_at,
        cover_url,
        video_url
      `)
      .eq('publisher_id', teacherId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw error
    }

    console.log('📋 查询到教师个人成果数量:', achievements?.length || 0)

    // 获取类型信息（可选）
    let typeMap = {}
    try {
      const { data: types } = await supabase
        .from('achievement_types')
        .select('id, name')
      
      if (types) {
        typeMap = types.reduce((map, type) => {
          map[type.id] = type.name
          return map
        }, {})
      }
    } catch (typeError) {
      console.warn('获取类型信息失败，使用默认值:', typeError.message)
    }

    // 获取附件信息
    const achievementIds = achievements.map(a => a.id)
    const { data: attachments } = achievementIds.length > 0 ? await supabase
      .from('achievement_attachments')
      .select('achievement_id, file_url')
      .in('achievement_id', achievementIds) : { data: [] }

    // 获取审批记录（驳回原因）
    const { data: approvalRecords } = achievementIds.length > 0 ? await supabase
      .from('approval_records')
      .select('achievement_id, feedback, status')
      .in('achievement_id', achievementIds)
      .order('reviewed_at', { ascending: false }) : { data: [] }

    // 创建附件映射
    const attachmentMap = {}
    attachments?.forEach(att => {
      if (!attachmentMap[att.achievement_id]) {
        attachmentMap[att.achievement_id] = []
      }
      attachmentMap[att.achievement_id].push(att.file_url)
    })

    // 创建审批记录映射
    const approvalMap = {}
    approvalRecords?.forEach(record => {
      approvalMap[record.achievement_id] = record
    })

    // 格式化响应数据（匹配前端期望格式）
    const formattedProjects = achievements.map(achievement => {
      let statusText = '未知'
      switch (achievement.status) {
        case 1:
          statusText = '待审核'
          break
        case 2:
          statusText = '已通过'
          break
        case 3:
          statusText = '已打回'
          break
        default:
          statusText = '未知'
      }
      
      // 获取驳回原因（如果有审批记录）
      let rejectReason = ''
      if (achievement.status === 3) {
        const approvalRecord = approvalMap[achievement.id]
        rejectReason = approvalRecord?.feedback || '需要进一步完善研究方法和数据分析'
      }
      
      return {
        id: achievement.id,
        title: achievement.title,
        project_type: typeMap[achievement.type_id] || '项目',
        status: achievement.status,
        status_text: statusText,
        cover_image: attachmentMap[achievement.id]?.[0] || null,
        images_array: attachmentMap[achievement.id] || [],
        created_at: achievement.created_at,
        updated_at: achievement.created_at, // 使用created_at作为updated_at
        reject_reason: rejectReason,
        score: achievement.score,
        content_html: achievement.description
      }
    })

    return paginatedResponse(res, formattedProjects, count, page, pageSize)

  } catch (error) {
    console.error('获取教师个人项目列表错误:', error)
    console.error('错误详情:', {
      message: error.message,
      details: error.details,
      code: error.code,
      stack: error.stack
    })
    return errorResponse(res, `获取项目列表失败: ${error.message}`)
  }
})

// 获取成果库（所有已通过的成果）
router.get('/library', authenticateToken, requireTeacher, validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page, pageSize } = req.validatedData
    const offset = (page - 1) * pageSize

    // 获取已通过成果总数（状态为2表示已通过）
    const { count, error: countError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 2) // 2 表示已通过

    if (countError) {
      throw countError
    }

    // 获取已通过成果列表
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        description,
        video_url,
        created_at,
        users:publisher_id (id, username)
      `)
      .eq('status', 2) // 2 表示已通过
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw error
    }

    // 获取附件信息
    const achievementIds = achievements.map(a => a.id)
    const { data: attachments } = achievementIds.length > 0 ? await supabase
      .from('achievement_attachments')
      .select('achievement_id, file_url')
      .in('achievement_id', achievementIds) : { data: [] }

    // 创建附件映射
    const attachmentMap = {}
    attachments?.forEach(att => {
      if (!attachmentMap[att.achievement_id]) {
        attachmentMap[att.achievement_id] = []
      }
      attachmentMap[att.achievement_id].push(att.file_url)
    })

    // 获取评分信息
    const { data: approvalRecords } = await supabase
      .from('approval_records')
      .select('achievement_id, feedback')
      .in('achievement_id', achievementIds)

    const approvalMap = {}
    approvalRecords?.forEach(record => {
      approvalMap[record.achievement_id] = record
    })

    // 格式化响应数据
    const formattedProjects = achievements.map(achievement => ({
      id: achievement.id,
      title: achievement.title,
      content_html: achievement.description,
      video_url: achievement.video_url,
      cover_image: attachmentMap[achievement.id]?.[0] || null,
      images_array: attachmentMap[achievement.id] || [],
      student_name: achievement.users?.username || '未知学生',
      score: null, // 需要从其他表获取评分信息
      feedback: approvalMap[achievement.id]?.feedback || '',
      created_at: achievement.created_at
    }))

    return paginatedResponse(res, formattedProjects, count, page, pageSize)

  } catch (error) {
    console.error('获取成果库错误:', error)
    return errorResponse(res, '获取成果库失败')
  }
})

// 获取所有学生成果（教师查看用）- 新版本
router.get('/student-achievements', authenticateToken, requireTeacher, validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page, pageSize } = req.validatedData
    const offset = (page - 1) * pageSize

    console.log('🔍 获取所有学生成果列表（教师查看用）')

    // 首先获取所有学生用户ID（role = 1）
    const { data: studentUsers, error: studentError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 1) // role为1表示学生

    if (studentError) {
      console.error('获取学生用户列表失败:', studentError)
      throw studentError
    }

    const studentIds = studentUsers?.map(u => u.id) || []
    console.log('👨‍🎓 学生用户ID列表:', studentIds)

    if (studentIds.length === 0) {
      console.log('⚠️ 系统中没有学生用户')
      return paginatedResponse(res, [], 0, page, pageSize)
    }

    // 获取所有学生成果总数（排除草稿状态）
    const { count, error: countError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .in('publisher_id', studentIds)
      .neq('status', 0) // 排除草稿状态

    if (countError) {
      throw countError
    }

    console.log('📊 学生成果总数（排除草稿）:', count)

    // 获取所有学生成果列表
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        description,
        type_id,
        status,
        score,
        publisher_id,
        instructor_id,
        created_at,
        cover_url,
        video_url
      `)
      .in('publisher_id', studentIds) // 只获取学生的成果
      .neq('status', 0) // 排除草稿状态
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw error
    }

    console.log('📋 查询到学生成果数量:', achievements?.length || 0)

    // 获取用户信息
    const publisherIds = [...new Set(achievements.map(a => a.publisher_id))]
    const { data: users } = publisherIds.length > 0 ? await supabase
      .from('users')
      .select('id, username, class_id')
      .in('id', publisherIds) : { data: [] }

    // 创建用户映射
    const userMap = {}
    users?.forEach(user => {
      userMap[user.id] = user
    })

    // 获取附件信息
    const achievementIds = achievements.map(a => a.id)
    const { data: attachments } = achievementIds.length > 0 ? await supabase
      .from('achievement_attachments')
      .select('achievement_id, file_url')
      .in('achievement_id', achievementIds) : { data: [] }

    // 创建附件映射
    const attachmentMap = {}
    attachments?.forEach(att => {
      if (!attachmentMap[att.achievement_id]) {
        attachmentMap[att.achievement_id] = []
      }
      attachmentMap[att.achievement_id].push(att.file_url)
    })

    // 格式化响应数据
    const formattedProjects = achievements.map(achievement => {
      const user = userMap[achievement.publisher_id] || {}
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        project_type: '项目', // 简化类型，避免关联查询
        status: achievement.status,
        score: achievement.score,
        cover_image: attachmentMap[achievement.id]?.[0] || null,
        student_id: achievement.publisher_id,
        student_name: user.username || '未知学生',
        class_name: '未分类', // 简化处理
        grade_name: '未分类', // 简化处理
        instructor_id: achievement.instructor_id,
        instructor_name: '未指定', // 简化处理
        created_at: achievement.created_at
      }
    })

    return paginatedResponse(res, formattedProjects, count, page, pageSize)

  } catch (error) {
    console.error('获取学生成果列表错误:', error)
    console.error('错误详情:', {
      message: error.message,
      details: error.details,
      code: error.code,
      stack: error.stack
    })
    return errorResponse(res, `获取学生成果列表失败: ${error.message}`)
  }
})

export default router