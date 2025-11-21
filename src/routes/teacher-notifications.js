import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireTeacher } from '../middleware/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

const router = express.Router();

// 获取教师的待审批通知
router.get('/pending', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // 查询需要教师审批的成果（状态为1表示待审核）
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
      .eq('status', 1) // 1 表示待审核
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取待审批通知失败:', error);
      return errorResponse(res, '获取待审批通知失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    // 获取附件信息
    const achievementIds = achievements.map(a => a.id);
    const { data: attachments } = achievementIds.length > 0 ? await supabase
      .from('achievement_attachments')
      .select('achievement_id, file_url')
      .in('achievement_id', achievementIds) : { data: [] };

    // 创建附件映射
    const attachmentMap = {};
    attachments?.forEach(att => {
      if (!attachmentMap[att.achievement_id]) {
        attachmentMap[att.achievement_id] = [];
      }
      attachmentMap[att.achievement_id].push(att.file_url);
    });

    // 格式化响应数据
    const formattedNotifications = achievements.map(achievement => ({
      id: achievement.id,
      title: achievement.title,
      cover_image: attachmentMap[achievement.id]?.[0] || null,
      student_name: achievement.users?.username || '未知学生',
      created_at: achievement.created_at,
      status: 'pending'
    }));

    return successResponse(res, formattedNotifications);

  } catch (error) {
    console.error('获取待审批通知错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 获取教师的已通过通知
router.get('/approved', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // 查询教师已审批通过的成果（状态为2表示已通过）
    const { data: approvalRecords, error } = await supabase
      .from('approval_records')
      .select(`
        id,
        achievement_id,
        reviewed_at,
        feedback,
        status,
        achievements!inner(id, title, publisher_id),
        users!inner(id, username)
      `)
      .eq('reviewer_id', teacherId)
      .eq('status', 2) // 2 表示通过
      .order('reviewed_at', { ascending: false });

    if (error) {
      console.error('获取已通过通知失败:', error);
      return errorResponse(res, '获取已通过通知失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    // 获取学生信息
    const studentIds = [...new Set(approvalRecords.map(record => record.achievements.publisher_id))];
    const { data: students } = studentIds.length > 0 ? await supabase
      .from('users')
      .select('id, username')
      .in('id', studentIds) : { data: [] };

    const studentMap = {};
    students?.forEach(student => {
      studentMap[student.id] = student.username;
    });

    // 格式化响应数据
    const formattedNotifications = approvalRecords.map(record => ({
      id: record.id,
      title: record.achievements.title,
      cover_image: null, // 没有封面图字段
      student_name: studentMap[record.achievements.publisher_id] || '未知学生',
      score: null, // 需要从其他表获取评分信息
      created_at: record.reviewed_at,
      status: 'approved'
    }));

    return successResponse(res, formattedNotifications);

  } catch (error) {
    console.error('获取已通过通知错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 获取教师的已驳回通知
router.get('/rejected', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // 查询教师已审批驳回的成果（状态为3表示已驳回）
    const { data: approvalRecords, error } = await supabase
      .from('approval_records')
      .select(`
        id,
        achievement_id,
        reviewed_at,
        feedback,
        status,
        achievements!inner(id, title, publisher_id),
        users!inner(id, username)
      `)
      .eq('reviewer_id', teacherId)
      .eq('status', 3) // 3 表示驳回
      .order('reviewed_at', { ascending: false });

    if (error) {
      console.error('获取已驳回通知失败:', error);
      return errorResponse(res, '获取已驳回通知失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    // 获取学生信息
    const studentIds = [...new Set(approvalRecords.map(record => record.achievements.publisher_id))];
    const { data: students } = studentIds.length > 0 ? await supabase
      .from('users')
      .select('id, username')
      .in('id', studentIds) : { data: [] };

    const studentMap = {};
    students?.forEach(student => {
      studentMap[student.id] = student.username;
    });

    // 格式化响应数据
    const formattedNotifications = approvalRecords.map(record => ({
      id: record.id,
      title: record.achievements.title,
      cover_image: null, // 没有封面图字段
      student_name: studentMap[record.achievements.publisher_id] || '未知学生',
      reject_reason: record.feedback || '未提供原因',
      created_at: record.reviewed_at,
      status: 'rejected'
    }));

    return successResponse(res, formattedNotifications);

  } catch (error) {
    console.error('获取已驳回通知错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 清除单个通知
router.delete('/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const notificationId = req.params.id;

    // 这里可以实现标记为已读的逻辑
    // 由于当前数据结构限制，我们暂时直接返回成功
    // 在实际应用中，可以添加一个通知表来管理已读状态

    return successResponse(res, null, '通知已清除');

  } catch (error) {
    console.error('清除通知错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 清除某类型的全部通知
router.delete('/clear/:type', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const type = req.params.type; // pending, approved, rejected

    // 这里可以实现批量标记为已读的逻辑
    // 由于当前数据结构限制，我们暂时直接返回成功

    const typeText = type === 'pending' ? '待审批' : type === 'approved' ? '已通过' : '已驳回';
    return successResponse(res, null, `所有${typeText}通知已清除`);

  } catch (error) {
    console.error('清除通知错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

// 更新教师个人资料
router.put('/profile', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { avatar, signature } = req.body;

    // 更新用户资料
    const updateData = {};
    if (avatar !== undefined) updateData.avatar = avatar;
    if (signature !== undefined) updateData.signature = signature;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', teacherId);

      if (error) {
        console.error('更新教师资料失败:', error);
        return errorResponse(res, '更新资料失败', HTTP_STATUS.INTERNAL_ERROR);
      }
    }

    return successResponse(res, null, '资料更新成功');

  } catch (error) {
    console.error('更新教师资料错误:', error);
    return errorResponse(res, '服务器错误', HTTP_STATUS.INTERNAL_ERROR);
  }
});

export default router;