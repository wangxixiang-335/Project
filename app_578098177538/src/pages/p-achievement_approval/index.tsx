import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

interface Achievement {
  id: string;
  name: string;
  type: string;
  studentName: string;
  studentAvatar: string;
  teacherName: string;
  submitTime: string;
  className: string;
  instructorName: string;
  content?: string;
  videoUrl?: string;
  images?: string[];
  category?: string;
}

const AchievementApprovalPage: React.FC = () => {
  // 状态管理
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [currentAchievementId, setCurrentAchievementId] = useState<string | null>(null);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [score, setScore] = useState('');
  
  // 成果数据和状态
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 搜索状态
  const [searchParams, setSearchParams] = useState({
    className: '',
    type: '',
    projectName: '',
    studentName: ''
  });

  // 获取待审批成果列表
  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('开始获取待审批成果列表...');
      // 使用正确的API路径 /review/pending
      const response = await api.get('/review/pending', {
        page: 1,
        pageSize: 50
      });
      
      console.log('获取待审批成果响应:', response);
      
      if (response && response.data) {
        let items = [];
        
        // 处理不同的响应格式
        if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          items = response.data.items;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          items = response.data.data;
        } else {
          console.warn('未预期的响应格式:', response.data);
          items = [];
        }
        
        const formattedAchievements = items.map((item: any) => ({
          id: item.id?.toString() || item.project_id?.toString(),
          name: item.title || item.name || '未知项目',
          type: item.type || '项目报告',
          studentName: item.student_name || item.studentName || item.username || '未知学生',
          studentAvatar: item.student_avatar || item.studentAvatar || '',
          teacherName: item.teacher_name || item.teacherName || '当前教师',
          submitTime: item.submitted_at || item.submitTime || item.created_at ? 
            new Date(item.submitted_at || item.submitTime || item.created_at).toLocaleString() : '未知时间',
          className: item.class_name || item.className || item.class || '未知班级',
          instructorName: item.instructor_name || item.instructorName || item.instructor || '未指定'
        }));
        
        console.log('格式化后的成果列表:', formattedAchievements);
        setAchievements(formattedAchievements);
      } else {
        console.warn('响应数据为空或格式不正确');
        setAchievements([]);
      }
    } catch (error: any) {
      console.error('获取待审批成果失败:', error);
      setError(error.message || '获取数据失败');
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 页面加载时获取数据
  useEffect(() => {
    fetchAchievements();
  }, []);
  
  // 搜索处理函数
  const handleSearchChange = (field: string, value: string) => {
    setSearchParams(prev => ({ ...prev, [field]: value }));
  };

  // 过滤成果列表
  const filteredAchievements = achievements.filter(achievement => {
    const { className, type, projectName, studentName } = searchParams;
    return (
      (!className || achievement.className.toLowerCase().includes(className.toLowerCase())) &&
      (!type || achievement.type.toLowerCase().includes(type.toLowerCase())) &&
      (!projectName || achievement.name.toLowerCase().includes(projectName.toLowerCase())) &&
      (!studentName || achievement.studentName.toLowerCase().includes(studentName.toLowerCase()))
    );
  });

  // 点击成果行 - 获取完整详情并显示弹窗
  const handleReviewClick = async (achievement: Achievement) => {
    console.log('点击成果行 - 成果信息:', achievement);
    setCurrentAchievementId(achievement.id);
    setCurrentAchievement(achievement);
    
    try {
      // 获取完整成果详情
      console.log('获取成果详情 - ID:', achievement.id);
      const response = await api.get(`/review/${achievement.id}`);
      console.log('成果详情响应:', response);
      
      if (response && response.data) {
        const detailData = response.data.data || response.data;
        setCurrentAchievement(prev => ({
          ...prev,
          content: detailData.content_html || detailData.description || '暂无详细内容',
          videoUrl: detailData.video_url || '',
          images: detailData.images_array || [],
          category: detailData.category || detailData.type_id || '项目报告'
        }));
      }
    } catch (error) {
      console.error('获取成果详情失败:', error);
      // 即使没有详细信息，也继续显示基本信息
      setCurrentAchievement(prev => ({
        ...prev,
        content: '暂无详细内容',
        videoUrl: '',
        images: [],
        category: '项目报告'
      }));
    }
    
    setShowPreviewModal(true);
  };
  

  
  // 驳回按钮点击
  const handleRejectClick = () => {
    console.log('点击驳回按钮');
    setShowRejectModal(true);
  };
  
  // 取消驳回
  const handleCancelReject = () => {
    setShowRejectModal(false);
    setRejectReason('');
  };
  
  // 确认驳回
  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('请输入驳回原因');
      return;
    }
    
    try {
      console.log('驳回操作 - 项目ID:', currentAchievementId);
      console.log('驳回原因:', rejectReason);
      
      // 确保驳回原因不为空字符串
      const validRejectReason = rejectReason.trim() || '需要进一步完善';
      
      // 使用正确的API路径和参数格式
      const response = await api.post(`/review/${currentAchievementId}/audit`, {
        audit_result: 2, // 2 表示驳回
        reject_reason: validRejectReason
      });
      
      console.log('驳回成功响应:', response);
      alert('成果已驳回，消息已推送给学生及指导老师');
      
      setShowRejectModal(false);
      setShowPreviewModal(false);
      setRejectReason('');
      setCurrentAchievementId(null);
      setCurrentAchievement(null);
      
      // 刷新列表
      fetchAchievements();
    } catch (error: any) {
      console.error('驳回失败:', error);
      alert('驳回失败: ' + (error.message || '未知错误'));
    }
  };
  
  // 通过按钮点击
  const handleApproveClick = () => {
    console.log('点击通过按钮');
    // 显示评分界面
    setShowScoreModal(true);
  };
  
  // 取消评分
  const handleCancelScore = () => {
    setShowScoreModal(false);
    setScore('');
  };
  
  // 确认通过（无评分）
  const handleConfirmApprove = async () => {
    try {
      console.log('通过操作 - 项目ID:', currentAchievementId);
      
      // 使用正确的API路径和参数格式
      const response = await api.post(`/review/${currentAchievementId}/audit`, {
        audit_result: 1, // 1 表示通过
        reject_reason: '' // 通过时不需要驳回原因，但提供空字符串避免验证错误
      });
      
      console.log('通过成功响应:', response);
      alert('成果已通过，消息已推送给学生及指导老师');
      
      setShowPreviewModal(false);
      setCurrentAchievementId(null);
      setCurrentAchievement(null);
      
      // 刷新列表
      fetchAchievements();
    } catch (error: any) {
      console.error('通过失败:', error);
      alert('通过失败: ' + (error.message || '未知错误'));
    }
  };

  // 确认评分并提交
  const handleConfirmScore = async () => {
    const scoreValue = parseInt(score);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
      alert('请输入有效的分数（0-100）');
      return;
    }
    
    try {
      console.log('通过操作 - 项目ID:', currentAchievementId);
      console.log('评分:', scoreValue);
      
      // 先更新成果分数，然后进行审批
      try {
        // 1. 更新成果分数
        console.log('更新成果分数...');
        const scoreResponse = await api.put(`/projects/${currentAchievementId}/score`, {
          score: scoreValue
        });
        console.log('分数更新成功:', scoreResponse);
      } catch (scoreError) {
        console.log('分数更新失败（可能接口不存在）:', scoreError);
        // 继续审批流程，分数可能需要在审批时一并提交
      }
      
      // 2. 执行审批操作
      const response = await api.post(`/review/${currentAchievementId}/audit`, {
        audit_result: 1, // 1 表示通过
        reject_reason: '', // 通过时不需要驳回原因
        score: scoreValue // 传递分数给后端
      });
      
      console.log('通过成功响应:', response);
      
      // 从响应中获取分数信息
      const responseScore = response?.data?.score || scoreValue;
      alert(`成果已通过，分数：${responseScore}分，消息已推送给学生及指导老师`);
      
      setShowScoreModal(false);
      setShowPreviewModal(false);
      setScore('');
      setCurrentAchievementId(null);
      setCurrentAchievement(null);
      
      fetchAchievements();
    } catch (error: any) {
      console.error('评分失败:', error);
      alert('评分失败: ' + (error.message || '未知错误'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">成果审批</h1>
          <p className="mt-2 text-gray-600">审批学生提交的成果项目</p>
        </div>
        
        {/* 搜索栏 */}
      <div className="bg-white shadow rounded-lg mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">班级</label>
            <select 
              value={searchParams.className}
              onChange={(e) => handleSearchChange('className', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部班级</option>
              <option value="一班">一班</option>
              <option value="二班">二班</option>
              <option value="三班">三班</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
            <select 
              value={searchParams.type}
              onChange={(e) => handleSearchChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部类型</option>
              <option value="项目报告">项目报告</option>
              <option value="研究报告">研究报告</option>
              <option value="实验报告">实验报告</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">成果名称</label>
            <input 
              type="text"
              value={searchParams.projectName}
              onChange={(e) => handleSearchChange('projectName', e.target.value)}
              placeholder="输入成果名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">学生姓名</label>
            <input 
              type="text"
              value={searchParams.studentName}
              onChange={(e) => handleSearchChange('studentName', e.target.value)}
              placeholder="输入学生姓名"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 成果列表 */}
      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <p className="text-gray-600">暂无待审批成果</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成果名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学生姓名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">班级</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">指导老师</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAchievements.map((achievement) => (
                  <tr 
                    key={achievement.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleReviewClick(achievement)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{achievement.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {achievement.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{achievement.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{achievement.className}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{achievement.instructorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{achievement.submitTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        查看详情
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
      
      {/* 成果详情模态框 */}
      {showPreviewModal && currentAchievement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              {/* 模态框标题 */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">成果详情</h3>
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* 成果基本信息 */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">{currentAchievement.name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">成果类型：</span>
                    <span className="text-gray-600">{currentAchievement.type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">学生姓名：</span>
                    <span className="text-gray-600">{currentAchievement.studentName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">所在班级：</span>
                    <span className="text-gray-600">{currentAchievement.className}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">指导老师：</span>
                    <span className="text-gray-600">{currentAchievement.instructorName}</span>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <span className="font-medium text-gray-700">提交时间：</span>
                    <span className="text-gray-600">{currentAchievement.submitTime}</span>
                  </div>
                </div>
              </div>
              
              {/* 成果内容 */}
              {(currentAchievement.content || currentAchievement.videoUrl || (currentAchievement.images && currentAchievement.images.length > 0)) && (
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-gray-900 mb-4">成果内容</h5>
                  
                  {/* 文本内容 */}
                  {currentAchievement.content && (
                    <div className="mb-4">
                      <div className="prose max-w-none text-gray-700 bg-white border border-gray-200 rounded-lg p-4">
                        <div dangerouslySetInnerHTML={{ __html: currentAchievement.content }} />
                      </div>
                    </div>
                  )}
                  
                  {/* 视频内容 */}
                  {currentAchievement.videoUrl && (
                    <div className="mb-4">
                      <h6 className="text-md font-medium text-gray-900 mb-2">视频展示</h6>
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <video 
                          src={currentAchievement.videoUrl} 
                          controls 
                          className="max-w-full max-h-full rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* 图片内容 */}
                  {currentAchievement.images && currentAchievement.images.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-md font-medium text-gray-900 mb-2">图片展示</h6>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {currentAchievement.images.map((image, index) => (
                          <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img 
                              src={image} 
                              alt={`成果图片 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 操作按钮 */}
              <div className="flex justify-between items-center px-4 py-6 bg-gray-50 rounded-lg mt-6">
                <button 
                  onClick={handleRejectClick}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-3 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  驳回
                </button>
                <button 
                  onClick={handleApproveClick}
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-3 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  通过
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 驳回原因输入模态框 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">输入驳回原因</h3>
              <div className="mt-2 mb-4">
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入详细的驳回原因，这将通知学生及指导老师..." 
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3 px-4 py-3">
                <button 
                  onClick={handleCancelReject}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleConfirmReject}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  确认驳回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 评分输入模态框（简化版）*/}
      {showScoreModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">输入评分</h3>
              <div className="mt-2 mb-6">
                <p className="text-sm text-gray-600 mb-4">请输入分数（0-100分），这将作为学生的最终成绩。</p>
                <input 
                  type="number"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="请输入分数（0-100）" 
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-center"
                />
              </div>
              <div className="flex justify-center space-x-3 px-4 py-3">
                <button 
                  onClick={handleCancelScore}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleConfirmScore}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  确认通过
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementApprovalPage;