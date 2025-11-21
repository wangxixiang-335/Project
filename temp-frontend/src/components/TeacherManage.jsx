import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeacherManage.css';

const API_BASE = 'http://localhost:3000/api';

const TeacherManage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('all'); // all, published, pending, rejected, drafts
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    projectId: null,
    projectTitle: ''
  });
  const [aiSolutionModal, setAiSolutionModal] = useState({
    isOpen: false,
    projectId: null,
    rejectReason: '',
    solution: ''
  });

  // 获取教师的成果列表（只获取教师自己的成果）
  const loadProjects = async () => {
    try {
      // 检查用户是否已登录且具有教师角色
      if (!user || user.role !== 'teacher') {
        console.error('❌ 用户未登录或不是教师角色');
        setMessage('请先登录教师账号');
        return;
      }

      // 获取token
      const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken') || localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ 没有教师认证token');
        setMessage('请先登录教师账号');
        return;
      }

      console.log('🚀 开始加载教师个人成果列表，使用token:', token.substring(0, 20) + '...');

      // 获取教师的个人成果（使用正确的端点）
      const response = await axios.get(`${API_BASE}/teacher/my-projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 50 }
      });

      console.log('📋 教师个人成果API响应:', response.data);

      if (response.data.success && response.data.data) {
        const projectsData = Array.isArray(response.data.data) ? response.data.data : [];
        console.log(`✅ 获取到 ${projectsData.length} 个教师个人成果`);
        setProjects(projectsData);
        filterProjects(projectsData, activeTab, searchTerm);
        setMessage(''); // 清除错误信息
      } else {
        console.warn('⚠️ 教师个人成果API返回数据格式无效:', response.data);
        setMessage('数据格式错误');
      }

    } catch (error) {
      console.error('❌ 获取教师个人成果失败:', error);
      console.error('📋 完整错误:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // 使用模拟数据作为后备（匹配数据库状态码）
      console.log('🔄 使用模拟数据作为后备');
      const mockProjects = [
        {
          id: '1',
          title: '机器学习算法研究',
          project_type: '论文',
          status: 3, // 已打回
          cover_image: null,
          created_at: '2024-01-10T08:00:00Z',
          reject_reason: '研究方法描述不够详细，需要补充实验数据和分析过程',
          score: 85
        },
        {
          id: '2',
          title: 'Web应用开发',
          project_type: '项目',
          status: 2, // 已通过
          cover_image: null,
          created_at: '2024-01-12T10:30:00Z',
          score: 92
        },
        {
          id: '3',
          title: '数据可视化工具',
          project_type: '项目',
          status: 1, // 待审核
          cover_image: null,
          created_at: '2024-01-15T14:20:00Z'
        },
        {
          id: '4',
          title: '移动应用设计',
          project_type: '设计',
          status: 0, // 草稿
          cover_image: null,
          created_at: '2024-01-18T16:45:00Z'
        }
      ];
      setProjects(mockProjects);
      filterProjects(mockProjects, activeTab, searchTerm);
      setMessage('获取教师个人成果失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 过滤项目（匹配数据库实际状态码）
  const filterProjects = (projectsList, tab, search) => {
    let filtered = projectsList;

    // 按状态过滤（数据库状态：1待审核/2已通过/3已打回/0草稿）
    switch (tab) {
      case 'published':
        filtered = filtered.filter(p => p.status === 2); // 已通过
        break;
      case 'pending':
        filtered = filtered.filter(p => p.status === 1); // 待审核
        break;
      case 'rejected':
        filtered = filtered.filter(p => p.status === 3); // 已打回
        break;
      case 'drafts':
        filtered = filtered.filter(p => p.status === 0); // 草稿
        break;
      default:
        break;
    }

    // 按搜索词过滤
    if (search) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  // 删除项目
  const deleteProject = async (projectId) => {
    try {
      const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken') || localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE}/teacher/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage('项目删除成功');
        loadProjects(); // 刷新列表
        setDeleteModal({ isOpen: false, projectId: null, projectTitle: '' });
      }
    } catch (error) {
      console.error('删除项目失败:', error);
      setMessage('删除项目失败');
    }
  };

  // 撤回项目
  const withdrawProject = async (projectId) => {
    try {
      const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken') || localStorage.getItem('token');
      const response = await axios.put(`${API_BASE}/teacher/projects/${projectId}/withdraw`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage('项目撤回成功');
        loadProjects(); // 刷新列表
      }
    } catch (error) {
      console.error('撤回项目失败:', error);
      setMessage('撤回项目失败');
    }
  };

  // AI生成解决方案
  const generateAISolution = async (projectId, rejectReason) => {
    setAiSolutionModal({
      isOpen: true,
      projectId,
      rejectReason,
      solution: ''
    });

    try {
      const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken') || localStorage.getItem('token');
      
      // 模拟AI解决方案生成（如果API不可用）
      const mockSolution = `基于驳回原因分析，为您提供以下改进建议：

1. 针对"${rejectReason}"的具体问题：
   - 需要补充详细的研究方法和实验步骤
   - 建议增加数据支撑和对比分析
   - 完善结论部分的逻辑推导

2. 改进建议：
   - 重新梳理论文结构，确保逻辑清晰
   - 增加相关文献综述，提升理论基础
   - 补充实验数据和统计分析
   - 请指导教师协助审阅修改后的版本

3. 注意事项：
   - 修改后请仔细检查格式规范
   - 确保引用格式符合学术要求
   - 建议请同学或导师预审

预计修改时间：3-5个工作日`;

      // 先显示模拟解决方案
      setAiSolutionModal(prev => ({ ...prev, solution: mockSolution }));

      // 尝试调用真实API
      try {
        const response = await axios.post(`${API_BASE}/ai/solution`, {
          reject_reason: rejectReason
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setAiSolutionModal(prev => ({ ...prev, solution: response.data.data }));
        }
      } catch (apiError) {
        console.log('AI API调用失败，使用模拟解决方案');
      }
    } catch (error) {
      console.error('AI解决方案生成失败:', error);
      setMessage('AI解决方案生成失败');
    }
  };

  // 获取状态文本（匹配数据库实际状态码）
  const getStatusText = (status) => {
    switch (status) {
      case 1: return '待审核';
      case 2: return '已通过';
      case 3: return '已打回';
      case 0: return '草稿';
      default: return '未知';
    }
  };

  // 获取状态样式（匹配数据库实际状态码）
  const getStatusStyle = (status) => {
    switch (status) {
      case 1: return 'status-pending';     // 待审核
      case 2: return 'status-approved';    // 已通过
      case 3: return 'status-rejected';    // 已打回
      case 0: return 'status-draft';       // 草稿
      default: return '';
    }
  };

  // 获取可用操作（匹配数据库实际状态码）
  const getAvailableActions = (project) => {
    const actions = [];
    
    switch (project.status) {
      case 1: // 待审核
        actions.push({ label: '撤回', action: 'withdraw', className: 'btn-withdraw' });
        break;
      case 2: // 已通过
        actions.push({ label: '编辑', action: 'edit', className: 'btn-edit' });
        actions.push({ label: '删除', action: 'delete', className: 'btn-delete' });
        break;
      case 3: // 已打回
        actions.push({ label: '编辑', action: 'edit', className: 'btn-edit' });
        actions.push({ label: 'AI解决方案', action: 'ai-solution', className: 'btn-ai' });
        actions.push({ label: '删除', action: 'delete', className: 'btn-delete' });
        break;
      case 0: // 草稿
        actions.push({ label: '编辑', action: 'edit', className: 'btn-edit' });
        actions.push({ label: '删除', action: 'delete', className: 'btn-delete' });
        break;
      default:
        break;
    }
    
    return actions;
  };

  // 处理操作
  const handleAction = (action, project) => {
    switch (action) {
      case 'edit':
        // 编辑项目逻辑
        console.log('编辑项目:', project.id);
        break;
      case 'delete':
        setDeleteModal({
          isOpen: true,
          projectId: project.id,
          projectTitle: project.title
        });
        break;
      case 'withdraw':
        withdrawProject(project.id);
        break;
      case 'ai-solution':
        generateAISolution(project.id, project.reject_reason || '未提供具体原因');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects(projects, activeTab, searchTerm);
  }, [activeTab, searchTerm, projects]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="teacher-manage">
      {message && (
        <div className={`message ${message.includes('失败') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* 状态标签 */}
      <div className="status-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部成果 ({projects.length})
        </button>
        <button 
          className={`tab ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          已发布 ({projects.filter(p => p.status === 2).length})
        </button>
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          审核中 ({projects.filter(p => p.status === 1).length})
        </button>
        <button 
          className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          未通过 ({projects.filter(p => p.status === 3).length})
        </button>
        <button 
          className={`tab ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          草稿箱 ({projects.filter(p => p.status === 0).length})
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="search-section">
        <div className="search-box">
          <input 
            type="text"
            placeholder="按成果名称搜索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="projects-list">
        {filteredProjects.length === 0 ? (
          <div className="no-projects">
            {searchTerm ? `未找到包含"${searchTerm}"的成果` : '暂无该状态的成果'}
          </div>
        ) : (
          <div className="projects-grid">
            {filteredProjects.map(project => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <div className="project-cover">
                    {project.cover_image ? (
                      <img src={project.cover_image} alt="封面" />
                    ) : (
                      <div className="cover-placeholder">📄</div>
                    )}
                  </div>
                  <div className="project-info">
                    <h4 className="project-title">{project.title}</h4>
                    <p className="project-time">{new Date(project.created_at).toLocaleString()}</p>
                    <span className={`status-badge ${getStatusStyle(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                  </div>
                </div>
                
                {project.status === 2 && project.reject_reason && (
                  <div className="reject-reason">
                    <strong>驳回原因：</strong> {project.reject_reason}
                  </div>
                )}
                
                {project.score && (
                  <div className="project-score">
                    <strong>得分：</strong> {project.score}
                  </div>
                )}
                
                <div className="project-actions">
                  {getAvailableActions(project).map(action => (
                    <button
                      key={action.action}
                      className={`btn ${action.className}`}
                      onClick={() => handleAction(action.action, project)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 删除确认模态框 */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, projectId: null, projectTitle: '' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认删除</h3>
              <button className="modal-close" onClick={() => setDeleteModal({ isOpen: false, projectId: null, projectTitle: '' })}>×</button>
            </div>
            <div className="modal-body">
              <p>确定要删除成果"{deleteModal.projectTitle}"吗？</p>
              <p className="warning-text">此操作不可恢复，请谨慎操作。</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteModal({ isOpen: false, projectId: null, projectTitle: '' })}>
                取消
              </button>
              <button className="btn btn-danger" onClick={() => deleteProject(deleteModal.projectId)}>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI解决方案模态框 */}
      {aiSolutionModal.isOpen && (
        <div className="modal-overlay" onClick={() => setAiSolutionModal({ isOpen: false, projectId: null, rejectReason: '', solution: '' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>AI解决方案</h3>
              <button className="modal-close" onClick={() => setAiSolutionModal({ isOpen: false, projectId: null, rejectReason: '', solution: '' })}>×</button>
            </div>
            <div className="modal-body">
              <div className="reject-reason-section">
                <h4>驳回原因</h4>
                <div className="reason-box">{aiSolutionModal.rejectReason}</div>
              </div>
              <div className="solution-section">
                <h4>AI建议解决方案</h4>
                <div className="solution-box">
                  {aiSolutionModal.solution || '生成中...'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAiSolutionModal({ isOpen: false, projectId: null, rejectReason: '', solution: '' })}>
                关闭
              </button>
              <button className="btn btn-primary" onClick={() => {
                // 复制解决方案到剪贴板
                navigator.clipboard.writeText(aiSolutionModal.solution);
                setMessage('解决方案已复制到剪贴板');
                setAiSolutionModal({ isOpen: false, projectId: null, rejectReason: '', solution: '' });
              }}>
                复制方案
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManage;