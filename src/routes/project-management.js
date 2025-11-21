import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

const router = express.Router();

// 获取项目列表（支持状态筛选和搜索）
router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, search } = req.query;

    let query = supabase
      .from('achievements')
      .select(`
        id,
        title,
        description,
        video_url,
        status,
        created_at
      `)
      .eq('publisher_id', userId)  // 使用achievements表的publisher_id字段
      .order('created_at', { ascending: false });

    // 状态筛选
    if (status && status !== 'all') {
      const statusMap = {
        'draft': 0,
        'pending': 1,
        'published': 2,
        'rejected': 3
      };
      if (statusMap[status] !== undefined) {
        query = query.eq('status', statusMap[status]);
      }
    }

    // 搜索功能
    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('获取项目列表失败:', error);
      return errorResponse(res, '获取项目列表失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    return successResponse(res, {
      items: projects || [],
      total: projects?.length || 0
    });

  } catch (error) {
    console.error('获取项目列表错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 撤回项目（待审批 -> 草稿）
router.put('/projects/:id/withdraw', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    // 检查项目是否存在且属于当前用户
    const { data: project, error: checkError } = await supabase
      .from('achievements')
      .select('id, status')
      .eq('id', projectId)
      .eq('publisher_id', userId) // 使用achievements表的publisher_id字段
      .single();

    if (checkError || !project) {
      return errorResponse(res, '项目不存在或无权限', HTTP_STATUS.NOT_FOUND);
    }

    // 只能撤回待审批的项目
    if (project.status !== 1) {
      return errorResponse(res, '只能撤回待审批的项目', HTTP_STATUS.BAD_REQUEST);
    }

    // 更新项目状态为草稿
    const { error: updateError } = await supabase
      .from('achievements')
      .update({ 
        status: 0
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('撤回项目失败:', updateError);
      return errorResponse(res, '撤回项目失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    return successResponse(res, null, '项目撤回成功，已移至草稿箱');

  } catch (error) {
    console.error('撤回项目错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 提交项目审批（草稿 -> 待审批）
router.put('/projects/:id/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    // 检查项目是否存在且属于当前用户
    const { data: project, error: checkError } = await supabase
      .from('achievements')
      .select('id, status, title, description, video_url')
      .eq('id', projectId)
      .eq('publisher_id', userId) // 使用achievements表的publisher_id字段
      .single();

    if (checkError || !project) {
      return errorResponse(res, '项目不存在或无权限', HTTP_STATUS.NOT_FOUND);
    }

    // 只能提交草稿状态的项目
    if (project.status !== 0) {
      return errorResponse(res, '只能提交草稿状态的项目', HTTP_STATUS.BAD_REQUEST);
    }

    // 检查项目内容是否完整（至少需要标题和一种内容）
    if (!project.title?.trim()) {
      return errorResponse(res, '项目标题不能为空', HTTP_STATUS.BAD_REQUEST);
    }

    if (!project.description?.trim() && !project.video_url?.trim()) {
      return errorResponse(res, '项目内容不能为空，请填写项目描述或视频链接', HTTP_STATUS.BAD_REQUEST);
    }

    // 更新项目状态为待审批
    const { error: updateError } = await supabase
      .from('achievements')
      .update({ 
        status: 1
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('提交项目审批失败:', updateError);
      return errorResponse(res, '提交项目审批失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    // 创建审批记录
    const { error: auditError } = await supabase
      .from('approval_records')
      .insert({
        achievement_id: projectId,
        reviewer_id: userId,
        status: 1,
        reviewed_at: new Date().toISOString()
      });

    if (auditError) {
      console.error('创建审批记录失败:', auditError);
      // 不影响主要功能，只记录错误
    }

    return successResponse(res, null, '项目提交成功，等待教师审批');

  } catch (error) {
    console.error('提交项目审批错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 删除项目
router.delete('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    // 检查项目是否存在且属于当前用户
    const { data: project, error: checkError } = await supabase
      .from('achievements')
      .select('id, status')
      .eq('id', projectId)
      .eq('publisher_id', userId) // 使用achievements表的publisher_id字段
      .single();

    if (checkError || !project) {
      return errorResponse(res, '项目不存在或无权限', HTTP_STATUS.NOT_FOUND);
    }

    // 物理删除项目
    const { error: deleteError } = await supabase
      .from('achievements')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      console.error('删除项目失败:', deleteError);
      return errorResponse(res, '删除项目失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    return successResponse(res, null, '项目删除成功');

  } catch (error) {
    console.error('删除项目错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 获取项目的审批记录
router.get('/projects/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    // 检查项目是否存在且属于当前用户
    const { data: project, error: checkError } = await supabase
      .from('achievements')
      .select('id')
      .eq('id', projectId)
      .eq('publisher_id', userId) // 使用achievements表的publisher_id字段
      .single();

    if (checkError || !project) {
      return errorResponse(res, '项目不存在或无权限', HTTP_STATUS.NOT_FOUND);
    }

    // 获取审批记录（包括教师审批和状态变更）
    const { data: reviews, error } = await supabase
      .from('approval_records')
      .select(`
        id,
        status,
        feedback,
        reviewed_at,
        reviewer:reviewer_id(username)
      `)
      .eq('achievement_id', projectId)
      .order('reviewed_at', { ascending: false });

    if (error) {
      console.error('获取审批记录失败:', error);
      return errorResponse(res, '获取审批记录失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    // 格式化审批记录
    const formattedReviews = (reviews || []).map(review => ({
      id: review.id,
      status: review.status,
      feedback: review.feedback,
      reject_reason: review.feedback,
      score: null, // achievements表没有score字段
      reviewer_name: review.reviewer?.username || '系统',
      created_at: review.reviewed_at,
      action: 'review'
    }));

    return successResponse(res, formattedReviews);

  } catch (error) {
    console.error('获取审批记录错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 获取学生趋势数据（用于图表）
router.get('/stats/student/trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取学生的所有项目，按时间排序 - achievements表没有评分字段
    const { data: projects, error } = await supabase
      .from('achievements')
      .select(`
        id, 
        title, 
        created_at, 
        status
      `)
      .eq('publisher_id', userId) // 使用achievements表的publisher_id字段
      .eq('status', 2) // 只获取已发布的项目
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取趋势数据失败:', error);
      return errorResponse(res, '获取趋势数据失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    // 格式化趋势数据 - achievements表没有评分字段
    const trends = (projects || []).map((project, index) => {
      return {
        project_id: project.id,
        project_title: project.title,
        score: null, // achievements表没有score字段
        created_at: project.created_at,
        sequence: index + 1
      };
    });

    return successResponse(res, trends);

  } catch (error) {
    console.error('获取趋势数据错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

export default router;