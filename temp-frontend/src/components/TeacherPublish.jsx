import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeacherPublish.css';

const API_BASE = 'http://localhost:3000/api';

const TeacherPublish = ({ user }) => {
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'
  const [projectForm, setProjectForm] = useState({
    title: '',
    projectType: '',
    coverImage: '',
    partners: '',
    instructor: user.username,
    content: '',
    videoUrl: '',
    attachments: []
  });
  const [instructors, setInstructors] = useState([]);
  const [aiModal, setAiModal] = useState({
    isOpen: false,
    type: '', // 'layout' or 'polish'
    content: '',
    result: ''
  });
  const [publishModal, setPublishModal] = useState({
    isOpen: false,
    selectedApprovers: []
  });
  const [draftModal, setDraftModal] = useState({
    isOpen: false
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 获取指导老师列表
  const loadInstructors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/teacher/instructors`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setInstructors(response.data.data || []);
      }
    } catch (error) {
      console.error('获取指导老师列表失败:', error);
    }
  };

  // 文件上传处理
  const handleFileUpload = async (file) => {
    if (projectForm.attachments.length >= 5) {
      setMessage('最多只能上传5个附件');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE}/upload/attachment`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setProjectForm(prev => ({
          ...prev,
          attachments: [...prev.attachments, {
            id: Date.now(),
            name: file.name,
            url: response.data.data.url,
            size: file.size
          }]
        }));
        setMessage('文件上传成功');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      setMessage('文件上传失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除附件
  const removeAttachment = (attachmentId) => {
    setProjectForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== attachmentId)
    }));
  };

  // AI一键布局
  const aiLayout = async () => {
    if (!projectForm.content) {
      setMessage('请先输入内容');
      return;
    }

    setAiModal({
      isOpen: true,
      type: 'layout',
      content: projectForm.content,
      result: ''
    });

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/ai/layout`, {
        content: projectForm.content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAiModal(prev => ({ ...prev, result: response.data.data }));
      }
    } catch (error) {
      console.error('AI布局失败:', error);
      setMessage('AI布局失败');
    } finally {
      setLoading(false);
    }
  };

  // AI一键润色
  const aiPolish = async () => {
    if (!projectForm.content) {
      setMessage('请先输入内容');
      return;
    }

    setAiModal({
      isOpen: true,
      type: 'polish',
      content: projectForm.content,
      result: ''
    });

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/ai/polish`, {
        content: projectForm.content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAiModal(prev => ({ ...prev, result: response.data.data }));
      }
    } catch (error) {
      console.error('AI润色失败:', error);
      setMessage('AI润色失败');
    } finally {
      setLoading(false);
    }
  };

  // 应用AI结果
  const applyAIResult = () => {
    setProjectForm(prev => ({
      ...prev,
      content: aiModal.result
    }));
    closeAIModal();
    setMessage('AI处理结果已应用');
  };

  // 关闭AI模态框
  const closeAIModal = () => {
    setAiModal({
      isOpen: false,
      type: '',
      content: '',
      result: ''
    });
  };

  // 保存草稿
  const saveDraft = () => {
    if (!projectForm.title || !projectForm.content) {
      setMessage('请至少填写标题和内容');
      return;
    }
    setDraftModal({ isOpen: true });
  };

  // 确认保存草稿
  const confirmSaveDraft = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/teacher/drafts`, {
        ...projectForm,
        status: 'draft'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage('草稿保存成功');
        setDraftModal({ isOpen: false });
        // 重置表单
        setProjectForm({
          title: '',
          projectType: '',
          coverImage: '',
          partners: '',
          instructor: user.username,
          content: '',
          videoUrl: '',
          attachments: []
        });
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      setMessage('保存草稿失败');
    } finally {
      setLoading(false);
    }
  };

  // 发布项目
  const publishProject = () => {
    if (!projectForm.title || !projectForm.content) {
      setMessage('请至少填写标题和内容');
      return;
    }
    setPublishModal({ isOpen: true, selectedApprovers: [] });
  };

  // 确认发布
  const confirmPublish = async () => {
    if (publishModal.selectedApprovers.length === 0) {
      setMessage('请选择至少一个审批人');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/teacher/projects`, {
        ...projectForm,
        approvers: publishModal.selectedApprovers,
        status: 'pending'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage('项目发布成功，等待审批');
        setPublishModal({ isOpen: false, selectedApprovers: [] });
        // 重置表单
        setProjectForm({
          title: '',
          projectType: '',
          coverImage: '',
          partners: '',
          instructor: user.username,
          content: '',
          videoUrl: '',
          attachments: []
        });
      }
    } catch (error) {
      console.error('发布项目失败:', error);
      setMessage('发布项目失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstructors();
  }, []);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="teacher-publish">
      {message && (
        <div className={`message ${message.includes('失败') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* 状态切换 */}
      <div className="status-tabs">
        <button 
          className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          编辑
        </button>
        <button 
          className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          预览
        </button>
      </div>

      {activeTab === 'edit' ? (
        <div className="edit-section">
          {/* 第一行：标题、成果类型、封面图 */}
          <div className="form-row">
            <div className="form-group">
              <label>成果标题 *</label>
              <input 
                type="text"
                value={projectForm.title}
                onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入成果标题"
                className="title-input"
              />
            </div>
            <div className="form-group">
              <label>成果类型</label>
              <select 
                value={projectForm.projectType}
                onChange={(e) => setProjectForm(prev => ({ ...prev, projectType: e.target.value }))}
              >
                <option value="">请选择类型</option>
                <option value="论文">论文</option>
                <option value="项目">项目</option>
                <option value="设计">设计</option>
                <option value="实验">实验</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label>封面图</label>
              <input 
                type="text"
                value={projectForm.coverImage}
                onChange={(e) => setProjectForm(prev => ({ ...prev, coverImage: e.target.value }))}
                placeholder="输入封面图URL"
                className="cover-input"
              />
            </div>
          </div>

          {/* 第二行：合作伙伴、指导老师 */}
          <div className="form-row">
            <div className="form-group">
              <label>合作伙伴</label>
              <input 
                type="text"
                value={projectForm.partners}
                onChange={(e) => setProjectForm(prev => ({ ...prev, partners: e.target.value }))}
                placeholder="多个合作伙伴用逗号分隔"
              />
            </div>
            <div className="form-group">
              <label>指导老师</label>
              <select 
                value={projectForm.instructor}
                onChange={(e) => setProjectForm(prev => ({ ...prev, instructor: e.target.value }))}
              >
                <option value={user.username}>{user.username}</option>
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.username}>
                    {instructor.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 第三行：富文本编辑窗口 */}
          <div className="form-group">
            <label>成果内容 *</label>
            <div className="ai-tools">
              <button className="btn btn-ai" onClick={aiLayout}>
                🤖 AI一键布局
              </button>
              <button className="btn btn-ai" onClick={aiPolish}>
                ✨ AI一键润色
              </button>
            </div>
            <textarea 
              rows="10"
              value={projectForm.content}
              onChange={(e) => setProjectForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="请输入成果内容，支持HTML格式"
              className="content-textarea"
            />
          </div>

          {/* 第四行：成果演示视频 */}
          <div className="form-group">
            <label>成果演示视频</label>
            <input 
              type="text"
              value={projectForm.videoUrl}
              onChange={(e) => setProjectForm(prev => ({ ...prev, videoUrl: e.target.value }))}
              placeholder="输入视频URL（可选）"
            />
            <small className="form-help">支持YouTube、B站等主流视频平台链接</small>
          </div>

          {/* 第五行：附件提交 */}
          <div className="form-group">
            <label>附件提交</label>
            <div className="attachments-section">
              {projectForm.attachments.map(attachment => (
                <div key={attachment.id} className="attachment-item">
                  <div className="attachment-info">
                    <span className="attachment-name">{attachment.name}</span>
                    <span className="attachment-size">({(attachment.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button 
                    className="btn-remove"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {projectForm.attachments.length < 5 && (
                <div className="attachment-add">
                  <input 
                    type="file"
                    id="file-upload"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <span className="add-icon">+</span>
                    <span>添加附件</span>
                  </label>
                  <small className="form-help">最多5个附件，单个文件不超过10MB</small>
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="form-actions">
            <button className="btn btn-draft" onClick={saveDraft}>
              存草稿
            </button>
            <button className="btn btn-publish" onClick={publishProject}>
              发布
            </button>
          </div>
        </div>
      ) : (
        <div className="preview-section">
          <div className="preview-content">
            <h2>{projectForm.title || '未命名成果'}</h2>
            {projectForm.coverImage && (
              <img src={projectForm.coverImage} alt="封面" className="preview-cover" />
            )}
            <div className="preview-meta">
              <p><strong>类型：</strong> {projectForm.projectType || '未指定'}</p>
              <p><strong>合作伙伴：</strong> {projectForm.partners || '无'}</p>
              <p><strong>指导老师：</strong> {projectForm.instructor}</p>
            </div>
            {projectForm.content && (
              <div className="preview-content-text">
                <h3>成果内容</h3>
                <div dangerouslySetInnerHTML={{ __html: projectForm.content }} />
              </div>
            )}
            {projectForm.videoUrl && (
              <div className="preview-video">
                <h3>演示视频</h3>
                <a href={projectForm.videoUrl} target="_blank" rel="noopener noreferrer">
                  查看视频
                </a>
              </div>
            )}
            {projectForm.attachments.length > 0 && (
              <div className="preview-attachments">
                <h3>附件</h3>
                {projectForm.attachments.map(attachment => (
                  <div key={attachment.id} className="preview-attachment">
                    📎 {attachment.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI处理模态框 */}
      {aiModal.isOpen && (
        <div className="modal-overlay" onClick={closeAIModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{aiModal.type === 'layout' ? 'AI一键布局' : 'AI一键润色'}</h3>
              <button className="modal-close" onClick={closeAIModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="ai-content">
                <div className="original-content">
                  <h4>原始内容</h4>
                  <div className="content-box">{aiModal.content}</div>
                </div>
                <div className="ai-result">
                  <h4>AI处理结果</h4>
                  <div className="content-box">{aiModal.result || '处理中...'}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAIModal}>
                取消
              </button>
              <button className="btn btn-primary" onClick={applyAIResult} disabled={!aiModal.result}>
                应用结果
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 草稿保存确认模态框 */}
      {draftModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDraftModal({ isOpen: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>保存草稿</h3>
              <button className="modal-close" onClick={() => setDraftModal({ isOpen: false })}>×</button>
            </div>
            <div className="modal-body">
              <p>确定要将当前内容保存为草稿吗？</p>
              <p>您可以在"成果管理"的"草稿箱"中查看和编辑此草稿。</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDraftModal({ isOpen: false })}>
                取消
              </button>
              <button className="btn btn-primary" onClick={confirmSaveDraft}>
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 发布模态框 */}
      {publishModal.isOpen && (
        <div className="modal-overlay" onClick={() => setPublishModal({ isOpen: false, selectedApprovers: [] })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>选择审批人</h3>
              <button className="modal-close" onClick={() => setPublishModal({ isOpen: false, selectedApprovers: [] })}>×</button>
            </div>
            <div className="modal-body">
              <div className="approvers-list">
                {instructors.map(instructor => (
                  <div key={instructor.id} className="approver-item">
                    <input 
                      type="checkbox"
                      id={`approver-${instructor.id}`}
                      checked={publishModal.selectedApprovers.includes(instructor.username)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPublishModal(prev => ({
                            ...prev,
                            selectedApprovers: [...prev.selectedApprovers, instructor.username]
                          }));
                        } else {
                          setPublishModal(prev => ({
                            ...prev,
                            selectedApprovers: prev.selectedApprovers.filter(name => name !== instructor.username)
                          }));
                        }
                      }}
                    />
                    <label htmlFor={`approver-${instructor.id}`}>
                      {instructor.username}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPublishModal({ isOpen: false, selectedApprovers: [] })}>
                取消
              </button>
              <button className="btn btn-primary" onClick={confirmPublish}>
                确认发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPublish;