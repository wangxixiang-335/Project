import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeacherLibrary.css';

const API_BASE = '/api';

const TeacherLibrary = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState('');
  const [searchForm, setSearchForm] = useState({
    className: '',
    projectType: '',
    score: '',
    studentName: '',
    projectName: ''
  });

  // 获取所有学生的成果数据
  const loadLibraryProjects = async () => {
    try {
      console.log('🚀 开始加载学生成果库...');
      
      // 检查用户是否已登录且具有教师角色
      if (!user || user.role !== 'teacher') {
        console.error('❌ 用户未登录或不是教师角色');
        setMessage('请先登录教师账号');
        return;
      }

      // 获取token，优先使用开发者token
      let token = localStorage.getItem('teacherToken') || 
                  sessionStorage.getItem('teacherToken') || 
                  localStorage.getItem('token');
      
      // 如果没有token，使用开发者token
      if (!token) {
        console.log('🔧 没有找到token，使用开发者模式');
        token = 'dev-teacher-token';
        localStorage.setItem('teacherToken', token);
      }

      console.log('🚀 使用token:', token.substring(0, 20) + '...');

      const response = await axios.get(`${API_BASE}/teacher/student-achievements`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1,
          pageSize: 100 // 获取更多数据用于前端筛选
        }
      });

      console.log('📋 学生成果库API响应:', response.data);

      if (response.data.success && response.data.data) {
        const projectsData = Array.isArray(response.data.data) ? response.data.data : response.data.data.items || [];
        console.log(`✅ 获取到 ${projectsData.length} 个学生成果`);
        setProjects(projectsData);
        setFilteredProjects(projectsData);
        setMessage(''); // 清除错误信息
      } else {
        console.warn('⚠️ 学生成果库API返回数据格式无效:', response.data);
        setMessage('数据格式错误');
      }
    } catch (error) {
      console.error('❌ 获取学生成果库失败:', error);
      console.error('📋 完整错误:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack,
        name: error.name
      });
      
      // 检查是否是认证错误
      if (error.response?.status === 401) {
        // 清除过期的token
        localStorage.removeItem('teacherToken');
        sessionStorage.removeItem('teacherToken');
        localStorage.removeItem('token');
        setMessage('认证已过期，请重新登录');
        return;
      }
      
      // 如果是400错误，可能是参数问题，尝试简化请求
      if (error.response?.status === 400) {
        console.log('🔄 尝试使用简化的参数重试...');
        try {
          const retryToken = localStorage.getItem('teacherToken') || 
                            sessionStorage.getItem('teacherToken') || 
                            localStorage.getItem('token') || 
                            'dev-teacher-token';
          const retryResponse = await axios.get(`${API_BASE}/teacher/student-achievements?page=1&pageSize=10`, {
            headers: { Authorization: `Bearer ${retryToken}` }
          });
          
          if (retryResponse.data.success) {
            const projectsData = Array.isArray(retryResponse.data.data) ? retryResponse.data.data : retryResponse.data.data.items || [];
            console.log(`✅ 重试成功，获取到 ${projectsData.length} 个学生成果`);
            setProjects(projectsData);
            setFilteredProjects(projectsData);
            setMessage('');
            return;
          }
        } catch (retryError) {
          console.log('❌ 重试也失败:', retryError.message);
        }
      }
      
      // 使用模拟学生成果数据作为后备（匹配新数据格式）
      console.log('🔄 使用模拟学生成果数据作为后备');
      const mockProjects = [
        {
          id: '1',
          title: '智能学习系统开发',
          project_type: '项目',
          student_name: '张三',
          student_id: 'S001',
          class_name: '计算机科学与技术1班',
          grade_name: '2021级',
          instructor_name: '李教授',
          score: 95,
          created_at: '2024-01-15T10:30:00Z',
          cover_image: null,
          status: 2
        },
        {
          id: '2',
          title: '基于深度学习的图像识别研究',
          project_type: '论文',
          student_name: '李四',
          student_id: 'S002',
          class_name: '软件工程2班',
          grade_name: '2021级',
          instructor_name: '王教授',
          score: 88,
          created_at: '2024-01-18T14:20:00Z',
          cover_image: null,
          status: 2
        },
        {
          id: '3',
          title: '移动应用UI设计',
          project_type: '设计',
          student_name: '王五',
          student_id: 'S003',
          class_name: '数字媒体技术1班',
          grade_name: '2021级',
          instructor_name: '陈教授',
          score: null,
          created_at: '2024-01-20T16:45:00Z',
          cover_image: null,
          status: 1
        },
        {
          id: '4',
          title: '电子商务平台开发',
          project_type: '项目',
          student_name: '赵六',
          student_id: 'S004',
          class_name: '计算机科学与技术2班',
          grade_name: '2022级',
          instructor_name: '张教授',
          score: 92,
          created_at: '2024-01-22T09:15:00Z',
          cover_image: null,
          status: 2
        },
        {
          id: '5',
          title: '机器学习模型优化研究',
          project_type: '论文',
          student_name: '孙七',
          student_id: 'S005',
          class_name: '人工智能1班',
          grade_name: '2022级',
          instructor_name: '刘教授',
          score: 85,
          created_at: '2024-01-25T11:30:00Z',
          cover_image: null,
          status: 2
        }
      ];
      setProjects(mockProjects);
      setFilteredProjects(mockProjects);
      
      // 根据错误类型显示不同的消息
      let errorMsg = '获取学生成果库失败: ' + (error.message || '未知错误');
      if (error.response?.status === 400) {
        errorMsg = '请求参数错误，已加载模拟数据供演示';
      } else if (error.response?.status >= 500) {
        errorMsg = '服务器错误，已加载模拟数据供演示';
      }
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  

  // 查看项目详情
  const viewProjectDetail = async (projectId) => {
    try {
      const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken') || localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/projects/${projectId}`, {
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

  // 导出数据
  const exportData = async () => {
    try {
      const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken') || localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/teacher/library/export`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...searchForm,
          format: 'excel'
        },
        responseType: 'blob'
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `成果库数据_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setMessage('数据导出成功');
    } catch (error) {
      console.error('数据导出失败:', error);
      setMessage('数据导出失败');
    }
  };

  // 过滤项目
  const filterProjects = (projectsList, formData) => {
    let filtered = projectsList;

    // 按班级过滤
    if (formData.className) {
      filtered = filtered.filter(p => 
        p.class_name && p.class_name.toLowerCase().includes(formData.className.toLowerCase())
      );
    }

    // 按类型过滤
    if (formData.projectType) {
      filtered = filtered.filter(p => 
        p.project_type && p.project_type === formData.projectType
      );
    }

    // 按分数过滤
    if (formData.score) {
      const scoreRange = formData.score.split('-');
      if (scoreRange.length === 2) {
        const minScore = parseInt(scoreRange[0]);
        const maxScore = parseInt(scoreRange[1]);
        filtered = filtered.filter(p => 
          p.score && p.score >= minScore && p.score <= maxScore
        );
      }
    }

    // 按学生姓名过滤
    if (formData.studentName) {
      filtered = filtered.filter(p => 
        p.student_name && p.student_name.toLowerCase().includes(formData.studentName.toLowerCase())
      );
    }

    // 按成果名称过滤
    if (formData.projectName) {
      filtered = filtered.filter(p => 
        p.title && p.title.toLowerCase().includes(formData.projectName.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  // 处理搜索表单提交
  const handleSearch = (e) => {
    e.preventDefault();
    filterProjects(projects, searchForm);
  };

  // 重置搜索
  const resetSearch = () => {
    setSearchForm({
      className: '',
      projectType: '',
      score: '',
      studentName: '',
      projectName: ''
    });
    setFilteredProjects(projects);
  };

  // 获取分数区间文本
  const getScoreText = (score) => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '中等';
    if (score >= 60) return '及格';
    return '不及格';
  };

  // 获取分数样式
  const getScoreStyle = (score) => {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    if (score >= 70) return 'score-average';
    if (score >= 60) return 'score-pass';
    return 'score-fail';
  };

  useEffect(() => {
    loadLibraryProjects();
  }, []);

  useEffect(() => {
    filterProjects(projects, searchForm);
  }, [projects]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="teacher-library">
      {message && (
        <div className={`message ${message.includes('失败') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* 成果查看标题 */}
      <div className="library-view-header">
        <h2>成果查看</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>以下是所有学生的成果，您可以查看详细信息。</p>
      </div>

      {/* 搜索栏 */}
      <div className="search-section">
        <h3>搜索筛选</h3>
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-row">
            <div className="form-group">
              <label>班级</label>
              <select 
                value={searchForm.className} 
                onChange={(e) => setSearchForm(prev => ({ ...prev, className: e.target.value }))}
              >
                <option value="">全部班级</option>
                <option value="计算机科学与技术1班">计算机科学与技术1班</option>
                <option value="软件工程2班">软件工程2班</option>
                <option value="数字媒体技术1班">数字媒体技术1班</option>
              </select>
            </div>
            <div className="form-group">
              <label>类型</label>
              <select 
                value={searchForm.projectType} 
                onChange={(e) => setSearchForm(prev => ({ ...prev, projectType: e.target.value }))}
              >
                <option value="">全部类型</option>
                <option value="论文">论文</option>
                <option value="项目">项目</option>
                <option value="设计">设计</option>
              </select>
            </div>
            <div className="form-group">
              <label>分数</label>
              <select 
                value={searchForm.score} 
                onChange={(e) => setSearchForm(prev => ({ ...prev, score: e.target.value }))}
              >
                <option value="">全部分数</option>
                <option value="90-100">90-100分（优秀）</option>
                <option value="80-89">80-89分（良好）</option>
                <option value="70-79">70-79分（中等）</option>
                <option value="60-69">60-69分（及格）</option>
                <option value="0-59">0-59分（不及格）</option>
              </select>
            </div>
          </div>
          <div className="search-row">
            <div className="form-group">
              <label>学生姓名</label>
              <input 
                type="text" 
                placeholder="输入学生姓名"
                value={searchForm.studentName}
                onChange={(e) => setSearchForm(prev => ({ ...prev, studentName: e.target.value }))}
              />
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
          </div>
          <div className="search-actions">
            <button type="button" className="btn btn-secondary" onClick={resetSearch}>
              重置
            </button>
            <button type="submit" className="btn btn-primary">
              搜索
            </button>
          </div>
        </form>
      </div>

      {/* 统计信息 */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>总成果数</h3>
            <p className="stat-number">{filteredProjects.length}</p>
          </div>
          <div className="stat-card">
            <h3>优秀成果</h3>
            <p className="stat-number">{filteredProjects.filter(p => p.score >= 90).length}</p>
          </div>
          <div className="stat-card">
            <h3>平均分数</h3>
            <p className="stat-number">
              {filteredProjects.length > 0 
                ? (filteredProjects.reduce((sum, p) => sum + (p.score || 0), 0) / filteredProjects.length).toFixed(1)
                : '0.0'
              }
            </p>
          </div>
          <div className="stat-card">
            <h3>参与学生</h3>
            <p className="stat-number">{new Set(filteredProjects.map(p => p.student_id)).size}</p>
          </div>
        </div>
      </div>

      {/* 成果列表 */}
      <div className="projects-section">
        <div className="section-header">
          <h3>成果列表 ({filteredProjects.length})</h3>
        </div>
        
        {filteredProjects.length === 0 ? (
          <div className="no-projects">
            未找到符合条件的学生成果
          </div>
        ) : (
          <div className="projects-table">
            <table>
              <thead>
                <tr>
                  <th>成果名称</th>
                  <th>分数</th>
                  <th>类型</th>
                  <th>学生姓名</th>
                  <th>指导老师</th>
                  <th>班级</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(project => (
                  <tr key={project.id}>
                    <td>
                      <div className="project-title-cell">
                        {project.cover_image && (
                          <img src={project.cover_image} alt="封面" className="project-cover-small" />
                        )}
                        <span className="project-name">{project.title}</span>
                      </div>
                    </td>
                    <td>
                      {project.score ? (
                        <div className={`score-badge ${getScoreStyle(project.score)}`}>
                          <span className="score-number">{project.score}</span>
                          <span className="score-text">{getScoreText(project.score)}</span>
                        </div>
                      ) : (
                        <span className="no-score">未评分</span>
                      )}
                    </td>
                    <td>{project.project_type || '未分类'}</td>
                    <td>{project.student_name}</td>
                    <td>{project.instructor_name || '未指定'}</td>
                    <td>{project.class_name || '未分类'}</td>
                    <td>{new Date(project.created_at).toLocaleString()}</td>
                    <td>
                      <button 
                        className="btn btn-view"
                        onClick={() => viewProjectDetail(project.id)}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 项目详情模态框 */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content project-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>成果详情</h3>
              <button className="modal-close" onClick={() => setSelectedProject(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="project-detail">
                <h4>{selectedProject.title}</h4>
                {selectedProject.cover_image && (
                  <img src={selectedProject.cover_image} alt="封面" className="detail-cover" />
                )}
                
                <div className="detail-meta">
                  <div className="meta-grid">
                    <div className="meta-item">
                      <strong>成果类型：</strong>
                      <span>{selectedProject.project_type || '未分类'}</span>
                    </div>
                    <div className="meta-item">
                      <strong>学生姓名：</strong>
                      <span>{selectedProject.student_name}</span>
                    </div>
                    <div className="meta-item">
                      <strong>指导老师：</strong>
                      <span>{selectedProject.instructor_name || '未指定'}</span>
                    </div>
                    <div className="meta-item">
                      <strong>班级：</strong>
                      <span>{selectedProject.class_name || '未分类'}</span>
                    </div>
                    <div className="meta-item">
                      <strong>分数：</strong>
                      <span className={getScoreStyle(selectedProject.score)}>
                        {selectedProject.score ? `${selectedProject.score}分 (${getScoreText(selectedProject.score)})` : '未评分'}
                      </span>
                    </div>
                    <div className="meta-item">
                      <strong>提交时间：</strong>
                      <span>{new Date(selectedProject.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedProject.content_html && (
                  <div className="detail-content">
                    <h5>成果内容：</h5>
                    <div dangerouslySetInnerHTML={{ __html: selectedProject.content_html }} />
                  </div>
                )}
                
                {selectedProject.video_url && (
                  <div className="detail-video">
                    <h5>演示视频：</h5>
                    <a href={selectedProject.video_url} target="_blank" rel="noopener noreferrer">
                      查看视频
                    </a>
                  </div>
                )}
                
                {selectedProject.feedback && (
                  <div className="detail-feedback">
                    <h5>评审意见：</h5>
                    <p>{selectedProject.feedback}</p>
                  </div>
                )}
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

export default TeacherLibrary;