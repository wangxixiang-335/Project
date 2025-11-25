import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import api from '../../utils/api';
import styles from './styles.module.css';

interface Achievement {
  id: string;
  title: string;
  publishDate: string;
  status: 'published' | 'pending' | 'rejected' | 'draft';
  coverImage?: string;
  rejectReason?: string;
  category: string;
  studentName?: string;
}

type FilterType = 'all' | 'published' | 'pending' | 'rejected' | 'draft';

const AchievementManagement: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 成果数据和状态
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '软院项目通 - 成果管理';
    return () => { document.title = originalTitle; };
  }, []);

  // 获取成果列表
  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/teacher/projects', {
        page: 1,
        pageSize: 50
      });
      
      if (response.data && Array.isArray(response.data.items)) {
        const formattedAchievements = response.data.items.map((item: any) => {
          let status: FilterType = 'pending';
          switch (item.status) {
            case 1:
              status = 'pending';
              break;
            case 2:
              status = 'published';
              break;
            case 3:
              status = 'rejected';
              break;
            default:
              status = 'pending';
          }
          
          return {
            id: item.project_id?.toString() || item.id?.toString(),
            title: item.title || '未知项目',
            publishDate: item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '未知时间',
            status,
            category: '科技',
            studentName: item.student_name || '未知学生'
          };
        });
        
        setAchievements(formattedAchievements);
      } else {
        setAchievements([]);
      }
    } catch (error: any) {
      console.error('获取成果列表失败:', error);
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

  // 筛选和搜索逻辑
  const filteredAchievements = achievements.filter(achievement => {
    const matchesStatus = activeFilter === 'all' || achievement.status === activeFilter;
    const matchesSearch = achievement.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // 移动端菜单切换
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 状态筛选处理
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  // 搜索处理
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // 编辑成果
  const handleEditAchievement = (achievementId: string) => {
    alert(`编辑成果 ${achievementId}`);
  };

  // 删除成果
  const handleDeleteAchievement = async (achievementId: string) => {
    if (confirm('确定要删除该成果吗？此操作不可恢复。')) {
      try {
        await api.delete(`/projects/${achievementId}`);
        alert('成果已删除');
        fetchAchievements();
      } catch (error: any) {
        alert('删除失败: ' + (error.message || '未知错误'));
      }
    }
  };

  // 撤回成果
  const handleWithdrawAchievement = (achievementId: string) => {
    if (confirm('确定要撤回该成果吗？撤回后将变为草稿状态。')) {
      alert(`撤回成果 ${achievementId}`);
    }
  };

  // 通知按钮
  const handleNotificationClick = () => {
    alert('通知功能开发中...');
  };

  // 渲染状态标签
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className={`${styles.statusBadge} ${styles.statusPublished}`}>已发布</span>;
      case 'pending':
        return <span className={`${styles.statusBadge} ${styles.statusPending}`}>审核中</span>;
      case 'rejected':
        return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>未通过</span>;
      case 'draft':
        return <span className={`${styles.statusBadge} ${styles.statusDraft}`}>草稿</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-bg-gray min-h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto bg-bg-gray">
          {/* 顶部导航栏 */}
          <header className="bg-white shadow-header px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleMobileMenuToggle}
                className="md:hidden text-text-secondary hover:text-secondary"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
              <h2 className="text-xl font-semibold text-text-primary hidden md:block">成果管理</h2>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleNotificationClick}
                className="text-text-secondary hover:text-secondary"
              >
                <i className="fas fa-bell text-xl"></i>
              </button>
            </div>
          </header>
          
          {/* 内容区域 */}
          <div className="p-6">
            {/* 搜索和筛选栏 */}
            <div className="bg-white rounded-xl shadow-card p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* 搜索框 */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="搜索成果..."
                      className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                    />
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"></i>
                  </div>
                </div>
                
                {/* 状态筛选 */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === 'all'
                        ? 'bg-secondary text-white'
                        : 'bg-bg-gray text-text-secondary hover:bg-border-light'
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => handleFilterChange('published')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === 'published'
                        ? 'bg-success text-white'
                        : 'bg-bg-gray text-text-secondary hover:bg-border-light'
                    }`}
                  >
                    已发布
                  </button>
                  <button
                    onClick={() => handleFilterChange('pending')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === 'pending'
                        ? 'bg-warning text-white'
                        : 'bg-bg-gray text-text-secondary hover:bg-border-light'
                    }`}
                  >
                    审核中
                  </button>
                  <button
                    onClick={() => handleFilterChange('rejected')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === 'rejected'
                        ? 'bg-danger text-white'
                        : 'bg-bg-gray text-text-secondary hover:bg-border-light'
                    }`}
                  >
                    未通过
                  </button>
                  <button
                    onClick={() => handleFilterChange('draft')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === 'draft'
                        ? 'bg-muted text-white'
                        : 'bg-bg-gray text-text-secondary hover:bg-border-light'
                    }`}
                  >
                    草稿
                  </button>
                </div>
              </div>
            </div>
            
            {/* 成果列表 */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary">我的成果</h3>
                <span className="text-sm text-text-muted">
                  共 {filteredAchievements.length} 个成果
                </span>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <i className="fas fa-spinner fa-spin text-4xl text-secondary mb-4"></i>
                  <p className="text-text-secondary">加载中...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <i className="fas fa-exclamation-triangle text-4xl text-warning mb-4"></i>
                  <p className="text-text-secondary">{error}</p>
                </div>
              ) : filteredAchievements.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-inbox text-4xl text-muted mb-4"></i>
                  <p className="text-text-secondary">暂无成果</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAchievements.map((achievement) => (
                    <div key={achievement.id} className={`${styles.achievementCard} bg-bg-gray rounded-xl overflow-hidden`}>
                      {/* 成果封面 */}
                      <div className="h-48 bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                        {achievement.coverImage ? (
                          <img 
                            src={achievement.coverImage} 
                            alt={achievement.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <i className="fas fa-file-alt text-4xl text-secondary mb-2"></i>
                            <p className="text-text-muted text-sm">{achievement.category}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* 成果信息 */}
                      <div className="p-6">
                        <div className="mb-3">
                          {renderStatusBadge(achievement.status)}
                        </div>
                        <h4 className="font-semibold text-text-primary mb-2 line-clamp-2">
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-text-muted mb-4">
                          {achievement.publishDate}
                        </p>
                        
                        {/* 操作按钮 */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditAchievement(achievement.id)}
                            className="flex-1 px-3 py-2 bg-secondary text-white rounded-lg hover:bg-accent transition-colors text-sm"
                          >
                            编辑
                          </button>
                          {achievement.status === 'published' && (
                            <button
                              onClick={() => handleWithdrawAchievement(achievement.id)}
                              className="px-3 py-2 border border-border-light text-text-secondary rounded-lg hover:bg-bg-gray transition-colors text-sm"
                            >
                              撤回
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAchievement(achievement.id)}
                            className="px-3 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AchievementManagement;