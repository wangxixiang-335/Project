import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'
import { validateRequest, paginationSchema } from '../middleware/validation.js'
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js'
import { PROJECT_STATUS, USER_ROLES, HTTP_STATUS } from '../config/constants.js'

const router = express.Router()

// 主页已发布项目列表（无需登录）
router.get('/projects/public', validateRequest(paginationSchema), async (req, res) => {
  try {
    const { page, pageSize } = req.validatedData
    const offset = (page - 1) * pageSize

    // 获取已发布项目总数
    const { count, error: countError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 2) // achievements表中已发布状态是2

    if (countError) {
      throw countError
    }

    // 获取已发布项目列表
    const { data: projects, error } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        description,
        video_url,
        created_at,
        publisher: publisher_id (username)
      `)
      .eq('status', 2) // achievements表中已发布状态是2
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw error
    }

    // 格式化响应数据（提取摘要）
    const formattedProjects = projects.map(project => ({
      project_id: project.id,
      title: project.title,
      content_summary: extractContentSummary(project.content_html),
      cover_image: project.images_array && project.images_array.length > 0 ? project.images_array[0] : null,
      images: project.images_array || [],
      video_url: project.video_url,
      student_name: project.profiles.username,
      published_at: project.audited_at,
      view_count: project.view_count
    }))

    return paginatedResponse(res, formattedProjects, count, page, pageSize)

  } catch (error) {
    console.error('获取公开项目列表错误:', error)
    return errorResponse(res, '获取项目列表失败')
  }
})

// 浏览量统计
router.post('/projects/:id/view', async (req, res) => {
  try {
    const { id } = req.params
    const userIp = req.ip || req.connection.remoteAddress
    
    // 检查项目是否存在
    const { data: project, error: checkError } = await supabase
      .from('achievements')
      .select('id, status')
      .eq('id', id)
      .single()

    if (checkError || !project) {
      return errorResponse(res, '项目不存在', HTTP_STATUS.NOT_FOUND)
    }

    // 检查1小时内是否已有相同IP的访问记录
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: recentView, error: viewError } = await supabase
      .from('view_records')
      .select('id')
      .eq('project_id', id)
      .eq('ip_address', userIp)
      .gt('viewed_at', oneHourAgo)
      .limit(1)

    if (viewError) {
      console.error('检查访问记录错误:', viewError)
    }

    // 如果1小时内没有相同IP的访问记录，则增加浏览量
    if (!recentView || recentView.length === 0) {
      // 原子递增浏览量 - achievements表没有view_count字段，跳过此操作
      const { data: updatedProject, error: updateError } = await supabase
        .from('achievements')
        .select('id')
        .eq('id', id)
        .single()

      if (updateError) {
        throw updateError
      }

      // 创建访问记录
      const { error: recordError } = await supabase
        .from('view_records')
        .insert({
          project_id: id,
          ip_address: userIp,
          viewed_at: new Date().toISOString()
        })

      if (recordError) {
        console.error('创建访问记录错误:', recordError)
      }

      return successResponse(res, {
        project_id: id,
        current_view_count: 0 // achievements表没有view_count字段
      }, '浏览量统计成功')
    } else {
      // 1小时内已有访问记录，不重复统计
      // 注意：achievements表没有view_count字段，返回0
      console.log(`项目 ${id} 在1小时内已有相同IP的访问记录，不重复统计`)
      
      return successResponse(res, {
        project_id: id,
        current_view_count: 0, // achievements表没有view_count字段
        message: '1小时内已统计过浏览量'
      })
    }

  } catch (error) {
    console.error('浏览量统计错误:', error)
    return errorResponse(res, '浏览量统计失败')
  }
})

// 学生端数据统计
router.get('/student', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== USER_ROLES.STUDENT) {
      return errorResponse(res, '仅限学生访问', HTTP_STATUS.FORBIDDEN)
    }

    // 获取学生项目统计
    const { data: stats, error } = await supabase
      .from('achievements')
      .select('status')
      .eq('publisher_id', req.user.id)

    if (error) {
      throw error
    }

    // 计算统计数据
    const totalProjects = stats?.length || 0
    const pendingCount = stats?.filter(p => p.status === PROJECT_STATUS.PENDING).length || 0
    const approvedCount = stats?.filter(p => p.status === PROJECT_STATUS.APPROVED).length || 0
    const rejectedCount = stats?.filter(p => p.status === PROJECT_STATUS.REJECTED).length || 0
    const totalViews = 0 // achievements表没有view_count字段

    // 获取各项目浏览量详情（暂时为空数组）
    const projectViews = []

    return successResponse(res, {
      total_projects: totalProjects,
      pending_count: pendingCount,
      approved_count: approvedCount,
      rejected_count: rejectedCount,
      total_views: totalViews,
      project_views: projectViews
    })

  } catch (error) {
    console.error('获取学生统计数据错误:', error)
    return errorResponse(res, '获取统计数据失败')
  }
})

// 教师端数据统计
router.get('/teacher', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== USER_ROLES.TEACHER) {
      return errorResponse(res, '仅限教师访问', HTTP_STATUS.FORBIDDEN)
    }

    // 获取平台整体统计
    const { data: allStats, error } = await supabase
      .from('achievements')
      .select('status') // achievements表没有view_count字段

    if (error) {
      throw error
    }

    // 计算统计数据
    const totalProjects = allStats.length
    const pendingCount = allStats.filter(p => p.status === PROJECT_STATUS.PENDING).length
    const approvedCount = allStats.filter(p => p.status === PROJECT_STATUS.APPROVED).length
    const rejectedCount = allStats.filter(p => p.status === PROJECT_STATUS.REJECTED).length
    const totalViews = allStats.reduce((sum, p) => sum + (p.view_count || 0), 0)
    
    // 计算审核通过率
    const totalAudited = approvedCount + rejectedCount
    const approvalRate = totalAudited > 0 ? (approvedCount / totalAudited * 100).toFixed(2) : 0

    // 获取用户统计
    const { data: userStats, error: userError } = await supabase
      .from('profiles')
      .select('role')

    if (userError) {
      console.error('获取用户统计错误:', userError)
    }

    const studentCount = userStats?.filter(u => u.role === USER_ROLES.STUDENT).length || 0
    const teacherCount = userStats?.filter(u => u.role === USER_ROLES.TEACHER).length || 0

    return successResponse(res, {
      total_projects: totalProjects,
      pending_count: pendingCount,
      approved_count: approvedCount,
      rejected_count: rejectedCount,
      total_views: totalViews,
      approval_rate: parseFloat(approvalRate),
      student_count: studentCount,
      teacher_count: teacherCount
    })

  } catch (error) {
    console.error('获取教师统计数据错误:', error)
    return errorResponse(res, '获取统计数据失败')
  }
})

// 从HTML内容中提取摘要
function extractContentSummary(htmlContent, maxLength = 200) {
  if (!htmlContent) return ''
  
  // 移除HTML标签
  const text = htmlContent.replace(/<[^>]*>/g, '')
  
  // 截取指定长度
  if (text.length <= maxLength) {
    return text
  }
  
  return text.substring(0, maxLength) + '...'
}

export default router