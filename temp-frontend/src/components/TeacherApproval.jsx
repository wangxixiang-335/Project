import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeacherApproval.css';

const API_BASE = '/api';

const TeacherApproval = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchForm, setSearchForm] = useState({
    className: '',
    projectType: '',
    projectName: '',
    studentName: ''
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    type: '', // 'approve' or 'reject'
    projectId: null,
    score: '',
    rejectReason: ''
  });
  const [message, setMessage] = useState('');

  // 获取待审批项目列表
  const loadPendingProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/teacher/pending-projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 50 }
      });

      if (response.data.success) {
        const projectsData = response.data.data.items || [];
        setProjects(projectsData);
        setFilteredProjects(projectsData);
      }
    } catch (error) {
      console.error('获取待审批项目失败:', error);
      setMessage('获取待审批项目失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索功能
  const handleSearch = () => {
    let filtered = projects;

    if (searchForm.className) {
      filtered = filtered.filter(project => 
        project.class_name?.includes(searchForm.className)
      );
    }

    if (searchForm.projectType) {
      filtered = filtered.filter(project => 
        project.project_type === searchForm.projectType
      );
    }

    if (searchForm.projectName) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchForm.projectName.toLowerCase())
      );
    }

    if (searchForm.studentName) {
      filtered = filtered.filter(project => 
        project.student_name?.toLowerCase().includes(searchForm.studentName.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  // 重置搜索
  const resetSearch = () => {
    setSearchForm({
      className: '',
      projectType: '',
      projectName: '',
      studentName: ''
    });
    setFilteredProjects(projects);
  };

  // 打开审批模态框
  const openReviewModal = (projectId, type) => {
    setReviewModal({
      isOpen: true,
      type,
      projectId,
      score: '',
      rejectReason: ''
    });
  };

  // 关闭审批模态框
  const closeReviewModal = () => {
    setReviewModal({
      isOpen: false,
      type: '',
      projectId: null,
      score: '',
      rejectReason: ''
    });
  };

  // 提交审批结果
  const submitReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const { type, projectId, score, rejectReason } = reviewModal;

      if (type === 'approve' && !score) {
        setMessage('请输入分数');
        return;
      }

      if (type === 'reject' && !rejectReason) {
        setMessage('请输入驳回原因');
        return;
      }

      const reviewData = {
        audit_result: type === 'approve' ? 1 : 2,
        ...(type === 'reject' ? { reject_reason: rejectReason } : {})
      };

      const response = await axios.post(
        `${API_BASE}/review/${projectId}/audit`,
        reviewData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage(type === 'approve' ? '审批通过成功' : '驳回成功');
        closeReviewModal();
        loadPendingProjects(); // 刷新列表
      }
    } catch (error) {
      console.error('提交审批失败:', error);
      setMessage('提交审批失败');
    }
  };

  // 查看项目详情
  const viewProjectDetail = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/projects/teacher/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedProject(response.data.data);
      }
    } catch (error) {
      console.error('获取项目详情失败:', error);
      setMessage('获取项目详情失败');
    }
  };

  useEffect(() => {
    loadPendingProjects();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchForm, projects]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="teacher-approval">
      {message && (
        <div className={`message ${message.includes('失败') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* 搜索栏 */}
      <div className="search-section">
        <h2>成果审批</h2>
        <div className="search-form">
          <div className="search-row">
            <div className="form-group">
              <label>班级</label>
              <select 
                value={searchForm.className}
                onChange={(e) => setSearchForm(prev => ({ ...prev, className: e.target.value }))}
              >
                <option value="">全部班级</option>
                <option value="计算机1班">计算机1班</option>
                <option value="计算机2班">计算机2班</option>
                <option value="软件1班">软件1班</option>
                <option value="软件2班">软件2班</option>
              </select>
            </div>
            <div className="form-group">
              <label>成果类型</label>
              <select 
                value={searchForm.projectType}
                onChange={(e) => setSearchForm(prev => ({ ...prev, projectType: e.target.value }))}
              >
                <option value="">全部类型</option>
                <option value="论文">论文</option>
                <option value="项目">项目</option>
                <option value="设计">设计</option>
                <option value="实验">实验</option>
              </select>
            </div>
            <div className="form-group">
              <label>成果名称</label>
              <input 
                type="text"
                placeholder="输入成果名称"
                value={searchForm.projectName}
                onChange={(e) => setSearchForm(prev => ({ ...prev, projectName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>学生姓名</label>
              <input 
                type="text"
                placeholder="输入学生姓名"
                value={searchForm.studentName}
                onChange={(e) => setSearchForm(prev => ({ ...prev, studentName: e.target.value }))}
              />
            </div>
          </div>
          <div className="search-actions">
            <button className="btn btn-primary" onClick={handleSearch}>
              搜索
            </button>
            <button className="btn btn-secondary" onClick={resetSearch}>
              重置
            </button>
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="projects-list">
        <div className="list-header">
          <h3>待审批成果列表 ({filteredProjects.length})</h3>
        </div>
        
        {filteredProjects.length === 0 ? (
          <div className="no-projects">
            暂无待审批的成果
          </div>
        ) : (
          <div className="projects-table">
            <table>
              <thead>
                <tr>
                  <th>成果名称</th>
                  <th>类型</th>
                  <th>学生姓名</th>
                  <th>指导老师</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(project => (
                  <tr key={project.id}>
                    <td>
                      <div className="project-title">
                        {project.title}
                        {project.cover_image && (
                          <img src={project.cover_image} alt="封面" className="project-cover" />
                        )}
                      </div>
                    </td>
                    <td>{project.project_type || '未分类'}</td>
                    <td>{project.student_name}</td>
                    <td>{project.instructor_name || '未指定'}</td>
                    <td>{new Date(project.created_at).toLocaleString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-view"
                          onClick={() => viewProjectDetail(project.id)}
                        >
                          查看
                        </button>
                        <button 
                          className="btn btn-approve"
                          onClick={() => openReviewModal(project.id, 'approve')}
                        >
                          通过
                        </button>
                        <button 
                          className="btn btn-reject"
                          onClick={() => openReviewModal(project.id, 'reject')}
                        >
                          驳回
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 审批模态框 */}
      {reviewModal.isOpen && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{reviewModal.type === 'approve' ? '审批通过' : '驳回申请'}</h3>
              <button className="modal-close" onClick={closeReviewModal}>×</button>
            </div>
            <div className="modal-body">
              {reviewModal.type === 'approve' ? (
                <div className="form-group">
                  <label>确认通过审批</label>
                  <p>您确定要通过这个项目吗？</p>
                </div>
              ) : (
                <div className="form-group">
                  <label>驳回原因</label>
                  <textarea 
                    rows="4"
                    value={reviewModal.rejectReason}
                    onChange={(e) => setReviewModal(prev => ({ ...prev, rejectReason: e.target.value }))}
                    placeholder="请输入驳回原因"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeReviewModal}>
                取消
              </button>
              <button className="btn btn-primary" onClick={submitReview}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 项目详情模态框 */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content project-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>项目详情</h3>
              <button className="modal-close" onClick={() => setSelectedProject(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="project-detail">
                <h4>{selectedProject.title}</h4>
                {selectedProject.cover_image && (
                  <img src={selectedProject.cover_image} alt="封面" className="detail-cover" />
                )}
                {selectedProject.content_html && (
                  <div className="project-content">
                    <h5>项目内容：</h5>
                    <div dangerouslySetInnerHTML={{ __html: selectedProject.content_html }} />
                  </div>
                )}
                {selectedProject.video_url && (
                  <div className="project-video">
                    <h5>项目视频：</h5>
                    <a href={selectedProject.video_url} target="_blank" rel="noopener noreferrer">
                      查看视频
                    </a>
                  </div>
                )}
                <div className="project-meta">
                  <p><strong>学生：</strong> {selectedProject.student_name}</p>
                  <p><strong>指导老师：</strong> {selectedProject.instructor_name || '未指定'}</p>
                  <p><strong>提交时间：</strong> {new Date(selectedProject.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedProject(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherApproval;