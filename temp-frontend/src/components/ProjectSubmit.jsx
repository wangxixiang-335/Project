import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api';

const ProjectSubmit = () => {
  const [formData, setFormData] = useState({
    title: '',
    content_html: '',
    video_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);
  const richEditorRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: '请先登录' });
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_BASE}/projects`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `项目提交成功！项目ID: ${response.data.data.project_id}` 
        });
        setFormData({
          title: '',
          content_html: '',
          video_url: ''
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: response.data.message || '提交失败' 
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误,请检查连接' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 动态加载富文本编辑器脚本
    const loadRichEditor = async () => {
      try {
        // 如果RichTextEditor未定义，尝试加载脚本
        if (typeof window.RichTextEditor === 'undefined') {
          const script = document.createElement('script');
          script.src = '/rich-editor.js';
          script.async = true;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        
        // 初始化富文本编辑器
        if (typeof window.RichTextEditor !== 'undefined' && richEditorRef.current) {
          const editor = new window.RichTextEditor('richEditorContainer', {
            placeholder: '请输入项目介绍，支持文字和图片混合编辑，类似学习通的作业提交体验...',
            maxImages: 10,
            uploadEndpoint: `${API_BASE}/upload/image`,
            onImageUpload: (data) => {
              console.log('图片上传成功:', data);
              setMessage({ type: 'success', text: `图片上传成功: ${data.url}` });
            },
            onContentChange: (content) => {
              setFormData(prev => ({
                ...prev,
                content_html: content
              }));
            }
          });
          
          // 保存编辑器实例引用
          richEditorRef.current = editor;
          
          // 设置初始内容
          if (formData.content_html) {
            editor.setContent(formData.content_html);
          }
        }
      } catch (error) {
        console.error('加载富文本编辑器失败:', error);
        setMessage({ type: 'error', text: '富文本编辑器加载失败，将使用普通文本框' });
      }
    };

    loadRichEditor();
    
    // 清理函数
    return () => {
      if (richEditorRef.current && richEditorRef.current.destroy) {
        richEditorRef.current.destroy();
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 如果修改的是content_html且富文本编辑器存在，同步更新编辑器内容
    if (name === 'content_html' && richEditorRef.current) {
      richEditorRef.current.setContent(value);
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 处理图片上传（现在通过富文本编辑器处理）
  const handleImageUpload = async (event) => {
    // 如果富文本编辑器已加载，使用编辑器上传功能
    if (richEditorRef.current) {
      setMessage({ type: 'info', text: '请使用富文本编辑器工具栏的图片按钮上传图片' });
      return;
    }
    
    // 后备方案：传统上传方式
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: '请先登录' });
      return;
    }

    setLoading(true);
    
    try {
      for (let file of files) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post(`${API_BASE}/upload/image`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success && response.data.data && response.data.data.url) {
          // 在光标位置插入图片
          const imgTag = `<img src="${response.data.data.url}" alt="项目图片" style="max-width: 100%; height: auto; margin: 10px 0;"/>`;
          setFormData(prev => ({
            ...prev,
            content_html: prev.content_html + imgTag
          }));
        } else {
          setMessage({ type: 'error', text: `图片上传失败: ${response.data.message}` });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: '图片上传出错' });
    } finally {
      setLoading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 快速插入HTML模板
  const insertTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      content_html: prev.content_html + template
    }));
  };

  const presetProjects = [
    {
      title: "纯文字项目示例",
      content_html: `<h3>项目介绍</h3><p>这是一个使用纯文字描述的项目示例。可以详细介绍项目的功能、技术栈、创新点等内容。</p><h4>主要功能</h4><ul><li>功能一：详细的项目描述</li><li>功能二：技术实现方案</li><li>功能三：创新亮点介绍</li></ul><p>通过文字可以完整表达项目的核心价值和实现思路。</p>`,
      video_url: ""
    },
    {
      title: "文字+图片项目示例",
      content_html: `<h3>在线购物平台</h3><p>使用React和Node.js构建的完整电商平台。</p><h4>技术栈</h4><ul><li>前端：React, Redux, Ant Design</li><li>后端：Node.js, Express, MongoDB</li></ul><img src="https://via.placeholder.com/600x400/FF6B6B/FFFFFF?text=项目截图" alt="项目截图"/><p>平台包含用户认证、商品管理、购物车、订单管理等核心功能。</p>`,
      video_url: ""
    },
    {
      title: "纯视频项目示例",
      content_html: "",
      video_url: "https://example.com/demo-video.mp4"
    }
  ];

  const fillPreset = (index) => {
    setFormData(presetProjects[index]);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="project-submit">
      <h2>项目提交</h2>
      
      <div className="preset-buttons">
        <h3>快速填充测试数据：</h3>
        {presetProjects.map((project, index) => (
          <button 
            key={index}
            type="button"
            className="preset-btn"
            onClick={() => fillPreset(index)}
          >
            填充: {project.title}
          </button>
        ))}
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>项目标题 *</label>
          <input 
            type="text" 
            name="title" 
            value={formData.title}
            onChange={handleChange}
            required 
            placeholder="请输入项目标题"
          />
        </div>

        <div className="form-group">
          <label>项目内容（文字 + 图片）</label>
          <div style={{marginBottom: '10px'}}>
            <button type="button" onClick={() => insertTemplate('<h3>项目介绍</h3>')} className="template-btn">插入标题</button>
            <button type="button" onClick={() => insertTemplate('<p>项目描述...</p>')} className="template-btn">插入段落</button>
            <button type="button" onClick={() => insertTemplate('<ul><li>功能特点1</li><li>功能特点2</li></ul>')} className="template-btn">插入列表</button>
          </div>
          
          {/* 富文本编辑器容器 */}
          <div id="richEditorContainer"></div>
          
          {/* 后备文本框（当富文本编辑器加载失败时使用） */}
          <textarea 
            name="content_html" 
            value={formData.content_html}
            onChange={handleChange}
            rows="10"
            placeholder="请输入项目介绍文字,支持HTML格式.可以只输入文字,也可以添加图片,或者只提供视频链接."
            style={{ display: richEditorRef.current ? 'none' : 'block', width: '100%' }}
          />
          
          <div style={{marginTop: '10px'}}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              style={{display: 'none'}}
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
              disabled={loading}
              style={{ display: richEditorRef.current ? 'none' : 'inline-block' }}
            >
              📷 上传图片（后备方案）
            </button>
            <small style={{color: '#666', marginLeft: '10px'}}>
              💡 使用富文本编辑器工具栏的 🖼️ 按钮上传图片，体验类似学习通的图文混合编辑
            </small>
          </div>
        </div>

        <div className="form-group">
          <label>演示视频地址（可选）</label>
          <input 
            type="url" 
            name="video_url" 
            value={formData.video_url}
            onChange={handleChange}
            placeholder="https://example.com/video.mp4"
          />
          <small style={{color: '#666'}}>
            提供项目演示视频的URL地址,可选填
          </small>
        </div>

        <button 
          type="submit" 
          className="btn" 
          disabled={loading}
        >
          {loading ? '提交中...' : '提交项目'}
        </button>
      </form>

      <style jsx>{`
        .project-submit {
          max-width: 600px;
          margin: 0 auto;
        }
        .preset-buttons {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .preset-buttons h3 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
        }
        .preset-btn {
          margin: 5px;
          padding: 8px 12px;
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .preset-btn:hover {
          background: #bbdefb;
        }
        .template-btn {
          margin: 2px;
          padding: 6px 10px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        }
        .template-btn:hover {
          background: #e0e0e0;
        }
        .upload-btn {
          padding: 8px 12px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .upload-btn:hover:not(:disabled) {
          background: #45a049;
        }
        .upload-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .message {
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }
        .message.success {
          background: #e8f5e8;
          color: #2e7d32;
          border: 1px solid #c8e6c9;
        }
        .message.error {
          background: #ffebee;
          color: #d32f2f;
          border: 1px solid #ffcdd2;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .form-group input, .form-group textarea, .form-group select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        .btn {
          width: 100%;
          padding: 12px;
          background: #007acc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        .btn:hover:not(:disabled) {
          background: #005a9e;
        }
        .btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ProjectSubmit;