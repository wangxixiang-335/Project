import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken as auth } from '../middleware/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

const router = express.Router();

// 获取用户通知列表
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查询项目审核通知 - 使用achievements表
    const { data: notifications, error } = await supabase
      .from('achievements')
      .select(`
        id,
        title,
        status,
        created_at
      `)
      .eq('publisher_id', userId)  // 使用achievements表的publisher_id字段
      .or('status.eq.2,status.eq.3') // 只获取已审核的项目（已发布/未通过）
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取通知失败:', error);
      return errorResponse(res, '获取通知失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    // 格式化通知数据 - 简化版本，只使用实际存在的字段
    const formattedNotifications = notifications.map(project => {
      return {
        id: project.id,
        project_title: project.title,
        project_cover: null, // 没有封面图字段
        status: parseInt(project.status), // 转换状态为数字
        score: null, // 没有评分字段，需要从project_reviews获取
        reject_reason: null, // 没有驳回原因字段
        feedback: null, // 没有反馈字段
        view_count: 0, // 没有浏览量字段
        created_at: project.updated_at // 使用更新时间作为通知时间
      };
    });

    return successResponse(res, formattedNotifications);

  } catch (error) {
    console.error('获取通知错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 清除单个通知（标记为已读）
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    // 检查项目是否属于当前用户
    const { data: project, error: checkError } = await supabase
      .from('achievements')
      .select('id')
      .eq('id', projectId)
      .eq('publisher_id', userId) // 使用achievements表的publisher_id字段
      .single();

    if (checkError || !project) {
      return errorResponse(res, '项目不存在或无权限', HTTP_STATUS.NOT_FOUND);
    }

    // 这里可以实现标记为已读的逻辑
    // 由于当前数据结构限制，我们暂时直接返回成功
    // 在实际应用中，可以添加一个通知表来管理已读状态

    return successResponse(res, null, '通知已清除');

  } catch (error) {
    console.error('清除通知错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 获取未读通知数量
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { count, error } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('publisher_id', userId) // 使用achievements表的publisher_id字段
      .or('status.eq.2,status.eq.3'); // 已审核的项目（已发布/未通过）

    if (error) {
      console.error('获取未读通知数量失败:', error);
      return errorResponse(res, '获取未读通知数量失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    return successResponse(res, { unreadCount: count || 0 });

  } catch (error) {
    console.error('获取未读通知数量错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

export default router;