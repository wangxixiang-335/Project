import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProjectManagement.css';

const API_BASE = '/api';

const ProjectManagement = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showReviewHistory, setShowReviewHistory] = useState(false);

  // 状态映射
  const statusMap = {
    0: { text: '草稿', color: '#9e9e9e', icon: '📝' },
    1: { text: '待审批', color: '#ff9800', icon: '⏳' },
    2: { text: '已发布', color: '#4caf50', icon: '✅' },
    3: { text: '未通过', color: '#f44336', icon: '❌' }
  };

  // 加载项目列表
  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      
      if (activeFilter !== 'all') {
        params.status = activeFilter;
      }
      
      if (searchTerm.trim()) {
        params.search = searchTerm;
      }
      
      const response = await axios.get(`${API_BASE}/project-management/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      if (response.data.success) {
        // 处理简化后的数据结构
        const projectsData = response.data.data.items || [];
        const validProjects = projectsData.filter(p => p && p.id).map(p => ({
          ...p,
          // 适配前端显示,添加兼容字段
          content_html: p.description || '', // achievements表使用description字段
          updated_at: p.created_at // achievements表没有updated_at字段
        }));
        setProjects(validProjects);
      }
    } catch (error) {
      console.error('获取项目失败:', error);
      setProjects([]); // 出错时设置为空数组
    } finally {
      setLoading(false);
    }
  };

  // 获取审批记录
  const loadReviewHistory = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/project-management/projects/${projectId}/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('获取审批记录失败:', error);
    }
    return [];
  };

  // 筛选项目
  const filterProjects = () => {
    let filtered = projects;

    // 按状态筛选
    if (activeFilter !== 'all') {
      const statusFilter = {
        'draft': 0,
        'pending': 1,
        'published': 2,
        'rejected': 3
      }[activeFilter];
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // 按搜索词筛选
    if (searchTerm.trim()) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  // 处理项目操作
  const handleProjectAction = async (projectId, action) => {
    try {
      const token = localStorage.getItem('token');
      
      switch (action) {
        case 'edit':
          // 编辑项目 - 可以跳转到编辑页面或打开编辑模态框
          const projectToEdit = projects.find(p => p.id === projectId);
          if (projectToEdit) {
            // 这里可以实现编辑功能
            alert(`编辑项目: ${projectToEdit.title}`);
          }
          break;
          
        case 'delete':
          if (window.confirm('确定要删除这个项目吗？此操作不可恢复。')) {
            const response = await axios.delete(`${API_BASE}/project-management/projects/${projectId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
              setProjects(prev => prev.filter(p => p.id !== projectId));
              alert('项目删除成功');
            }
          }
          break;
          
        case 'withdraw':
          if (window.confirm('确定要撤回这个项目吗？撤回后将变为草稿状态。')) {
            const response = await axios.put(`${API_BASE}/project-management/projects/${projectId}/withdraw`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
              loadProjects(); // 重新加载项目列表
              alert('项目撤回成功,已移至草稿箱');
            }
          }
          break;
          
        case 'submit':
          if (window.confirm('确定要提交这个项目进行审批吗？')) {
            const response = await axios.put(`${API_BASE}/project-management/projects/${projectId}/submit`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
              loadProjects(); // 重新加载项目列表
              alert('项目提交成功,等待教师审批');
            }
          }
          break;
          
        case 'view-history':
          const history = await loadReviewHistory(projectId);
          setSelectedProject({ id: projectId, reviews: history });
          setShowReviewHistory(true);
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败: ' + (error.response?.data?.error || '未知错误'));
    }
  };

  // 获取操作按钮配置
  const getActionButtons = (project) => {
    const buttons = [];
    
    switch (project.status) {
      case 0: // 草稿
        buttons.push(
          { label: '编辑', action: 'edit', type: 'primary' },
          { label: '删除', action: 'delete', type: 'danger' },
          { label: '提交审批', action: 'submit', type: 'success' }
        );
        break;
        
      case 1: // 待审批
        buttons.push(
          { label: '撤回', action: 'withdraw', type: 'warning' },
          { label: '审批记录', action: 'view-history', type: 'info' }
        );
        break;
        
      case 2: // 已发布
        buttons.push(
          { label: '编辑', action: 'edit', type: 'primary' },
          { label: '删除', action: 'delete', type: 'danger' },
          { label: '审批记录', action: 'view-history', type: 'info' }
        );
        break;
        
      case 3: // 未通过
        buttons.push(
          { label: '编辑', action: 'edit', type: 'primary' },
          { label: '删除', action: 'delete', type: 'danger' },
          { label: '审批记录', action: 'view-history', type: 'info' }
        );
        break;
        
      default:
        break;
    }
    
    return buttons;
  };

  useEffect(() => {
    loadProjects();
  }, [activeFilter, searchTerm]);

  useEffect(() => {
    filterProjects();
  }, [projects]);

  return (
    <div className="project-management">
      {/* 顶部筛选和搜索 */}
      <div className="management-header">
        <div className="filter-tabs">
          {[
            { key: 'all', label: '全部成果', count: projects.length },
            { key: 'draft', label: '草稿箱', count: projects.filter(p => p.status === 0).length },
            { key: 'pending', label: '审核中', count: projects.filter(p => p.status === 1).length },
            { key: 'published', label: '已发布', count: projects.filter(p => p.status === 2).length },
            { key: 'rejected', label: '未通过', count: projects.filter(p => p.status === 3).length }
          ].map(tab => (
            <button
              key={tab.key}
              className={`filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="按名称搜索成果..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="projects-list">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <div key={project.id} className="project-item">
              <div className="project-cover">
                {project.cover_image ? (
                  <img src={project.cover_image} alt={project.title} />
                ) : (
                  <div className="cover-placeholder">📄</div>
                )}
              </div>
              
              <div className="project-info">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-time">
                  发布时间: {new Date(project.created_at).toLocaleString()}
                </p>
                <div className="project-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: statusMap[project.status].color }}
                  >
                    {statusMap[project.status].icon} {statusMap[project.status].text}
                  </span>
                  {/* 暂时隐藏得分显示,因为没有评分数据 */}
                  {/* {project.project_reviews && project.project_reviews.length > 0 && 
                   project.project_reviews[0].score !== null && 
                   project.project_reviews[0].score !== undefined && (
                    <span className="score-badge">得分: {project.project_reviews[0].score}</span>
                  )} */}
                </div>
              </div>
              
              <div className="project-actions">
                {getActionButtons(project).map(button => (
                  <button
                    key={button.action}
                    className={`action-btn ${button.type}`}
                    onClick={() => handleProjectAction(project.id, button.action)}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-projects">
            <p>暂无符合条件的成果</p>
          </div>
        )}
      </div>

      {/* 审批记录模态框 */}
      {showReviewHistory && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowReviewHistory(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>审批记录</h2>
              <button className="modal-close" onClick={() => setShowReviewHistory(false)}>×</button>
            </div>
            <div className="modal-body">
              {selectedProject.reviews && selectedProject.reviews.length > 0 ? (
                selectedProject.reviews.map((review, index) => (
                  <div key={index} className="review-record">
                    <div className="review-header">
                      <span className="review-time">
                        {new Date(review.created_at).toLocaleString()}
                      </span>
                      <span className={`review-status ${review.status === 1 ? 'approved' : 'rejected'}`}>
                        {review.status === 1 ? '通过' : '驳回'}
                      </span>
                    </div>
                    {review.feedback && (
                      <div className="review-feedback">
                        <strong>审批意见:</strong> {review.feedback}
                      </div>
                    )}
                    {review.reject_reason && (
                      <div className="review-reject-reason">
                        <strong>驳回原因:</strong> {review.reject_reason}
                      </div>
                    )}
                    {review.status === 1 && review.score !== null && review.score !== undefined && (
                      <div className="review-score">
                        <strong>得分:</strong> {review.score}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>暂无审批记录</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowReviewHistory(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;