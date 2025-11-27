import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import api from '../../utils/api';
import styles from './styles.module.css';

interface Achievement {
  id: string;
  title: string;
  status: 'published' | 'reviewing' | 'rejected' | 'draft';
  time: string;
  coverImage?: string;
  rejectionReason?: string;
  hasApprovalHistory?: boolean;
}

const BusinessProcessPage: React.FC = () => {
  const navigate = useNavigate();
  const [globalSearchValue, setGlobalSearchValue] = useState('');
  const [achievementSearchValue, setAchievementSearchValue] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [showAiSolutionModal, setShowAiSolutionModal] = useState(false);
  const [showApprovalHistoryModal, setShowApprovalHistoryModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [currentDeleteId, setCurrentDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);

  // 获取当前用户信息
  const getCurrentUser = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      return {
        role: userInfo.role || 'student',
        userId: userInfo.user_id || userInfo.id,
        username: userInfo.username || userInfo.email || '用户'
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return { role: 'student', userId: null, username: '用户' };
    }
  };

  // 获取学生成果数据
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // 获取学生成果数据
  const fetchStudentAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userInfo = getCurrentUser();
      if (!userInfo.userId) {
        throw new Error('无法获取用户信息');
      }

      // 调用API获取学生的成果列表
      const response = await api.get(API_ENDPOINTS.PROJECTS.LIST, {
        student_id: userInfo.userId,
        status: 'all'
      });

      // 处理API响应数据
      let achievementsData = [];
      if (response.success && response.data) {
        achievementsData = response.data.items || response.data || [];
      } else if (response.projects || response.data) {
        achievementsData = response.projects || response.data || [];
      }

      // 转换数据格式以匹配前端接口
      const formattedAchievements = achievementsData.map((achievement: any) => {
        let status: Achievement['status'] = 'draft';
        
        // 根据数据库状态映射到前端状态
        switch (achievement.status) {
          case 'approved':
          case 2:
            status = 'published';
            break;
          case 'pending':
          case 1:
            status = 'reviewing';
            break;
          case 'rejected':
          case 3:
            status = 'rejected';
            break;
          default:
            status = 'draft';
        }

        // 格式化时间
        const createTime = achievement.created_at ? 
          new Date(achievement.created_at).toLocaleString('zh-CN') : 
          '未知时间';

        // 提取封面图（如果有）
        let coverImage = undefined;
        if (achievement.cover_url) {
          coverImage = achievement.cover_url;
        } else if (achievement.images_array && achievement.images_array.length > 0) {
          coverImage = achievement.images_array[0];
        }

        return {
          id: achievement.id,
          title: achievement.title || '未命名成果',
          status,
          time: `提交时间：${createTime}`,
          coverImage,
          rejectionReason: achievement.rejection_reason || achievement.reject_reason,
          hasApprovalHistory: achievement.approval_count > 0
        } as Achievement;
      });

      console.log('获取到学生成果数据:', formattedAchievements);
      setAchievements(formattedAchievements);
      setFilteredAchievements(formattedAchievements);

    } catch (error: any) {
      console.error('获取学生成果失败:', error);
      setError(error.message || '获取成果列表失败');
      
      // 如果API失败，显示空的成果列表
      setAchievements([]);
      setFilteredAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const originalTitle = document.title;
    document.title = '软院项目通 - 成果管理';
    return () => { document.title = originalTitle; };
  }, []);

  // 页面加载时获取数据
  useEffect(() => {
    // 临时修复：如果没有token，设置开发者模式token
    if (!localStorage.getItem('token')) {
      console.log('设置开发者学生token...');
      localStorage.setItem('token', 'dev-student-token');
      localStorage.setItem('userInfo', JSON.stringify({
        email: 'dev-student@example.com',
        role: 'student',
        user_id: 'dev-student-id'
      }));
    }
    
    // 获取真实的成果数据
    fetchStudentAchievements();
  }, []);

  const handleGlobalSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const searchTerm = globalSearchValue;
      console.log('全局搜索:', searchTerm);
      navigate(`/project-intro?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleAchievementSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const searchTerm = achievementSearchValue;
      console.log('成果搜索:', searchTerm);
      filterAchievementsByName(searchTerm);
    }
  };

  const handleStatusFilterClick = (status: string) => {
    setSelectedStatusFilter(status);
    filterAchievementsByStatus(status);
  };

  const handleEditAchievement = (achievementId: string) => {
    console.log('编辑成果:', achievementId);
    navigate(`/achievement-publish?id=${achievementId}`);
  };

  const handleDeleteAchievement = (achievementId: string) => {
    setCurrentDeleteId(achievementId);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (currentDeleteId) {
      try {
        setLoading(true);
        
        // 调用删除API
        const response = await api.del(`/projects/${currentDeleteId}`);
        
        if (response.success) {
          // 从本地状态中移除
          setAchievements(prev => prev.filter(achievement => achievement.id !== currentDeleteId));
          setFilteredAchievements(prev => prev.filter(achievement => achievement.id !== currentDeleteId));
          
          console.log('成果删除成功:', currentDeleteId);
        } else {
          console.error('删除失败:', response.error);
          alert('删除失败: ' + (response.error || '未知错误'));
        }
      } catch (error: any) {
        console.error('删除异常:', error);
        alert('删除异常: ' + (error.message || '网络错误'));
      } finally {
        setLoading(false);
        setShowDeleteConfirmModal(false);
        setCurrentDeleteId(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setCurrentDeleteId(null);
  };

  const handleWithdrawAchievement = (achievementId: string) => {
    console.log('撤回成果:', achievementId);
    setAchievements(prev => 
      prev.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, status: 'draft' as const, time: '最后编辑：' + new Date().toLocaleString() }
          : achievement
      )
    );
    setFilteredAchievements(prev => 
      prev.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, status: 'draft' as const, time: '最后编辑：' + new Date().toLocaleString() }
          : achievement
      )
    );
  };

  const handleAiSolution = (achievementId: string) => {
    console.log('获取AI解决方案:', achievementId);
    setShowAiSolutionModal(true);
  };

  const handleViewApprovalHistory = (achievementId: string) => {
    console.log('查看审批记录:', achievementId);
    setShowApprovalHistoryModal(true);
  };

  const filterAchievementsByStatus = (status: string) => {
    if (status === 'all') {
      setFilteredAchievements(achievements);
    } else {
      const filtered = achievements.filter(achievement => achievement.status === status);
      setFilteredAchievements(filtered);
    }
    console.log('按状态筛选成果:', status, '结果数量:', status === 'all' ? achievements.length : achievements.filter(a => a.status === status).length);
  };

  const filterAchievementsByName = (keyword: string) => {
    if (!keyword.trim()) {
      setFilteredAchievements(achievements);
    } else {
      const filtered = achievements.filter(achievement => 
        achievement.title.toLowerCase().includes(keyword.toLowerCase())
      );
      setFilteredAchievements(filtered);
    }
    console.log('按名称搜索成果:', keyword, '结果数量:', !keyword.trim() ? achievements.length : achievements.filter(a => a.title.toLowerCase().includes(keyword.toLowerCase())).length);
  };

  const getStatusDisplay = (status: Achievement['status']) => {
    switch (status) {
      case 'published':
        return { text: '已发布', color: 'text-green-600 bg-green-100' };
      case 'reviewing':
        return { text: '审核中', color: 'text-orange-600 bg-orange-100' };
      case 'rejected':
        return { text: '已驳回', color: 'text-red-600 bg-red-100' };
      case 'draft':
        return { text: '草稿', color: 'text-gray-600 bg-gray-100' };
      default:
        return { text: '未知', color: 'text-gray-600 bg-gray-100' };
    }
  };

  return (
    <>
      <div className={styles.pageWrapper}>
        {/* 顶部导航栏 */}
        <header className="fixed top-0 left-0 right-0 bg-bg-light border-b border-border-light h-16 z-50">
          <div className="flex items-center justify-between h-full px-6">
            {/* 左侧Logo区域 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-graduation-cap text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-text-primary">河北师范大学软件学院</h1>
                  <p className="text-xs text-text-muted">软院项目通</p>
                </div>
              </div>
            </div>

            {/* 中间搜索区域 */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="搜索项目..." 
                  value={globalSearchValue}
                  onChange={(e) => setGlobalSearchValue(e.target.value)}
                  onKeyPress={handleGlobalSearchKeyPress}
                  className={`w-full pl-10 pr-4 py-2 border border-border-light rounded-lg bg-white ${styles.searchInputFocus}`}
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted"></i>
              </div>
            </div>

            {/* 右侧用户区域 */}
            <div className="flex items-center space-x-4">
              <button className="text-text-muted hover:text-text-primary">
                <i className="fas fa-bell text-lg"></i>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                <span className="text-sm font-medium text-text-primary">学生</span>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="pt-16">
          <div className="container mx-auto px-6 py-8">
            {/* 页面标题和操作区域 */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">成果管理</h2>
                <p className="text-text-muted">管理您的项目成果，查看审核状态和反馈</p>
              </div>
              <button 
                onClick={() => navigate('/p-achievement_publish')}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
              >
                <i className="fas fa-plus"></i>
                <span>发布成果</span>
              </button>
            </div>

            {/* 搜索和筛选区域 */}
            <div className="bg-bg-light rounded-xl p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="relative w-full max-w-md">
                  <input 
                    type="text" 
                    placeholder="搜索成果名称..." 
                    value={achievementSearchValue}
                    onChange={(e) => setAchievementSearchValue(e.target.value)}
                    onKeyPress={handleAchievementSearchKeyPress}
                    className={`w-full pl-10 pr-4 py-2 border border-border-light rounded-lg bg-white ${styles.searchInputFocus}`}
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted"></i>
                </div>

                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <i className="fas fa-filter mr-2"></i>
                  筛选
                </button>
              </div>

              {/* 状态筛选标签 */}
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleStatusFilterClick('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatusFilter === 'all' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white border border-border-light text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  全部 ({achievements.length})
                </button>
                <button 
                  onClick={() => handleStatusFilterClick('draft')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatusFilter === 'draft' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white border border-border-light text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  草稿 ({achievements.filter(a => a.status === 'draft').length})
                </button>
                <button 
                  onClick={() => handleStatusFilterClick('reviewing')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatusFilter === 'reviewing' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white border border-border-light text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  审核中 ({achievements.filter(a => a.status === 'reviewing').length})
                </button>
                <button 
                  onClick={() => handleStatusFilterClick('published')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatusFilter === 'published' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white border border-border-light text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  已发布 ({achievements.filter(a => a.status === 'published').length})
                </button>
                <button 
                  onClick={() => handleStatusFilterClick('rejected')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatusFilter === 'rejected' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white border border-border-light text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  已驳回 ({achievements.filter(a => a.status === 'rejected').length})
                </button>
              </div>
            </div>

            {/* 成果列表 */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-circle text-red-500 mr-2"></i>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            ) : filteredAchievements.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-folder-open text-gray-400 text-3xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无成果</h3>
                <p className="text-gray-500 mb-4">还没有发布任何成果，点击上方按钮发布您的第一个成果</p>
                <button 
                  onClick={() => navigate('/p-achievement_publish')}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <i className="fas fa-plus mr-2"></i>
                  发布成果
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAchievements.map((achievement) => {
                  const statusDisplay = getStatusDisplay(achievement.status);
                  
                  return (
                    <div key={achievement.id} className="bg-bg-light rounded-xl shadow-card p-4 hover:shadow-card-hover transition-shadow">
                      {/* 成果封面图 */}
                      {achievement.coverImage ? (
                        <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                          <img 
                            src={achievement.coverImage} 
                            alt={`${achievement.title}成果封面`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-blue-100 rounded-lg mb-4 flex items-center justify-center">
                          <i className="fas fa-project-diagram text-4xl text-gray-400"></i>
                        </div>
                      )}

                      {/* 成果信息 */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary truncate">{achievement.title}</h3>
                          <p className="text-text-muted text-sm mb-2">{achievement.time}</p>
                        </div>

                        {/* 状态标签 */}
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                            {statusDisplay.text}
                          </span>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditAchievement(achievement.id)}
                              className="text-blue-500 hover:text-blue-700"
                              title="编辑"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            {achievement.status === 'rejected' && (
                              <button 
                                onClick={() => handleAiSolution(achievement.id)}
                                className="text-purple-500 hover:text-purple-700"
                                title="AI解决方案"
                              >
                                <i className="fas fa-robot"></i>
                              </button>
                            )}
                            {achievement.hasApprovalHistory && (
                              <button 
                                onClick={() => handleViewApprovalHistory(achievement.id)}
                                className="text-green-500 hover:text-green-700"
                                title="审批记录"
                              >
                                <i className="fas fa-history"></i>
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteAchievement(achievement.id)}
                              className="text-red-500 hover:text-red-700"
                              title="删除"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>

                        {/* 驳回原因 */}
                        {achievement.status === 'rejected' && achievement.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-700">
                              <i className="fas fa-exclamation-triangle mr-1"></i>
                              {achievement.rejectionReason}
                            </p>
                          </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex space-x-2 pt-2">
                          {achievement.status === 'draft' && (
                            <>
                              <button 
                                onClick={() => handleEditAchievement(achievement.id)}
                                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                              >
                                继续编辑
                              </button>
                              <button 
                                onClick={() => handleEditAchievement(achievement.id)}
                                className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                              >
                                提交审核
                              </button>
                            </>
                          )}
                          {achievement.status === 'reviewing' && (
                            <button 
                              onClick={() => handleWithdrawAchievement(achievement.id)}
                              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              撤回审核
                            </button>
                          )}
                          {achievement.status === 'published' && (
                            <button 
                              onClick={() => handleEditAchievement(achievement.id)}
                              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              查看详情
                            </button>
                          )}
                          {achievement.status === 'rejected' && (
                            <>
                              <button 
                                onClick={() => handleAiSolution(achievement.id)}
                                className="flex-1 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                              >
                                <i className="fas fa-robot mr-1"></i>AI解决方案
                              </button>
                              <button 
                                onClick={() => handleEditAchievement(achievement.id)}
                                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                              >
                                重新编辑
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* 审批历史模态框 */}
        {showApprovalHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-primary">审批记录</h3>
                <button 
                  onClick={() => setShowApprovalHistoryModal(false)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="space-y-4">
                <div className="border-l-4 border-red-400 pl-4 py-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-text-primary">驳回</h4>
                    <span className="text-text-muted text-sm">2023-11-25 15:20</span>
                  </div>
                  <p className="text-text-secondary mt-1">安全机制不完善，缺少隐私保护措施，建议加强用户数据安全保护。</p>
                  <p className="text-text-muted text-sm mt-2">审批人：李教授</p>
                </div>
                <div className="border-l-4 border-orange-400 pl-4 py-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-text-primary">审核中</h4>
                    <span className="text-text-muted text-sm">2023-11-22 10:15</span>
                  </div>
                  <p className="text-text-secondary mt-1">项目已提交至评审委员会，正在进行审核。</p>
                  <p className="text-text-muted text-sm mt-2">处理人：王助教</p>
                </div>
                <div className="border-l-4 border-green-400 pl-4 py-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-text-primary">提交成功</h4>
                    <span className="text-text-muted text-sm">2023-11-20 10:30</span>
                  </div>
                  <p className="text-text-secondary mt-1">项目成果已成功提交，等待审核。</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                  <i className="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">确认删除</h3>
                <p className="text-text-secondary">您确定要删除该成果吗？此操作无法撤销。</p>
              </div>
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={handleCancelDelete}
                  className="px-4 py-2 border border-border-light rounded-lg text-text-secondary hover:bg-gray-50"
                >
                  取消
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI解决方案模态框 */}
        {showAiSolutionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-primary">AI解决方案</h3>
                <button 
                  onClick={() => setShowAiSolutionModal(false)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">基于驳回原因的解决方案</h4>
                  <p className="text-text-secondary">根据您的项目被驳回的原因，AI建议您从以下几个方面进行改进：</p>
                  <ul className="list-disc list-inside text-text-secondary mt-2 space-y-1">
                    <li>完善功能设计文档，详细描述每个功能模块的实现方式和交互流程</li>
                    <li>添加用户体验测试环节，收集至少20名用户的反馈意见</li>
                    <li>编写详细的测试报告，包括功能测试、性能测试和兼容性测试结果</li>
                    <li>优化用户界面设计，提高系统的易用性和美观度</li>
                  </ul>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">技术实现建议</h4>
                  <p className="text-text-secondary">针对您的项目类型，AI提供以下技术实现建议：</p>
                  <ul className="list-disc list-inside text-text-secondary mt-2 space-y-1">
                    <li>使用自动化测试工具如Selenium或Jest进行功能测试</li>
                    <li>采用用户体验测试工具如Hotjar或UserTesting收集用户反馈</li>
                    <li>考虑使用原型设计工具如Figma或Adobe XD创建高保真原型</li>
                    <li>实施敏捷开发方法，分阶段迭代完善项目功能</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowAiSolutionModal(false)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  应用建议
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BusinessProcessPage;