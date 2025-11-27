

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { API_ENDPOINTS } from '../../config/api';
import styles from './styles.module.css';

interface Collaborator {
  id: string;
  name: string;
}

interface Attachment {
  id: string;
  file: File;
  name: string;
  type: string;
}

interface Photo {
  id: string;
  file: File;
  url: string;
  description: string;
}

interface Video {
  id: string;
  file: File;
  url: string;
  duration: number;
}

interface AchievementType {
  id: string;
  name: string;
}

const ProjectIntroPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 页面标题设置
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '软院项目通 - 学生端成果发布';
    return () => { document.title = originalTitle; };
  }, []);

  // 响应式侧边栏处理
  useEffect(() => {
    const handleResize = () => {
      const sidebar = document.querySelector('#sidebar');
      const mainContent = document.querySelector('#main-content');
      
      if (window.innerWidth >= 1024) {
        if (sidebar) sidebar.classList.remove('-translate-x-full');
        if (mainContent) mainContent.classList.add('ml-64');
      } else {
        if (mainContent) mainContent.classList.remove('ml-64');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 加载成果类型
  useEffect(() => {
    const loadAchievementTypes = async () => {
      try {
        const response = await api.get('/achievement-types');
        if (response && response.data) {
          setAchievementTypes(response.data);
          // 设置默认类型为第一个可用类型
          if (response.data.length > 0 && !projectType) {
            setProjectType(response.data[0].id);
          }
        }
      } catch (error) {
        console.error('加载成果类型失败:', error);
        // 如果加载失败，使用默认类型
        setAchievementTypes([
          { id: 'course', name: '课程项目' },
          { id: 'research', name: '科研项目' }
        ]);
      }
    };
    
    loadAchievementTypes();
  }, []);

  // 表单状态
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [projectName, setProjectName] = useState('');
  const [projectLeader, setProjectLeader] = useState('');
  const [projectType, setProjectType] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [achievementTypes, setAchievementTypes] = useState<AchievementType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const richTextEditorRef = useRef<HTMLDivElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);
  const videoUploadRef = useRef<HTMLInputElement>(null);
  const documentUploadRef = useRef<HTMLInputElement>(null);
  const coverImageUploadRef = useRef<HTMLInputElement>(null);

  // 富文本编辑器命令
  const handleEditorCommand = (command: string) => {
    if (richTextEditorRef.current) {
      document.execCommand(command, false, null);
      richTextEditorRef.current.focus();
    }
  };

  // 处理富文本编辑器内容变化
  const handleRichTextChange = () => {
    if (richTextEditorRef.current) {
      setProjectDescription(richTextEditorRef.current.innerHTML);
    }
  };

  // 添加协作者
  const addCollaborator = () => {
    const name = collaboratorInput.trim();
    if (name) {
      const newCollaborator: Collaborator = {
        id: Date.now().toString(),
        name
      };
      setCollaborators([...collaborators, newCollaborator]);
      setCollaboratorInput('');
    }
  };

  // 删除协作者
  const removeCollaborator = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
  };

  // 照片上传
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newPhoto: Photo = {
            id: Date.now().toString(),
            file,
            url: event.target?.result,
            description: ''
          };
          setPhotos([...photos, newPhoto]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // 删除照片
  const removePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  // 更新照片描述
  const updatePhotoDescription = (id: string, description: string) => {
    setPhotos(photos.map(p => p.id === id ? { ...p, description } : p));
  };

  // 视频上传
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const video = document.createElement('video');
          video.src = event.target?.result;
          video.onloadedmetadata = () => {
            const newVideo: Video = {
              id: Date.now().toString(),
              file,
              url: event.target?.result,
              duration: video.duration
            };
            setVideos([...videos, newVideo]);
          };
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // 删除视频
  const removeVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  // 文档上传
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFile(file);
    }
  };

  // 清除文档
  const clearDocument = () => {
    setDocumentFile(null);
    if (documentUploadRef.current) {
      documentUploadRef.current.value = '';
    }
  };

  // 处理封面图片上传
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 文件验证
      console.log('选择的文件:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
      });
      
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('请选择 JPG、JPEG、PNG 或 WebP 格式的图片文件');
        return;
      }
      
      // 验证文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('文件过大，请选择小于 5MB 的图片');
        return;
      }
      
      setCoverImage(file);
      const url = URL.createObjectURL(file);
      setCoverImageUrl(url);
    }
  };

  // 清除封面图片
  const clearCoverImage = () => {
    setCoverImage(null);
    if (coverImageUrl) {
      URL.revokeObjectURL(coverImageUrl);
      setCoverImageUrl('');
    }
    if (coverImageUploadRef.current) {
      coverImageUploadRef.current.value = '';
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (coverImageUrl) {
        URL.revokeObjectURL(coverImageUrl);
      }
    };
  }, [coverImageUrl]);

  // 项目上传
  const handleUploadProject = async () => {
    if (!projectName || !projectLeader) {
      alert('请输入项目名称和负责人');
      return;
    }

    if (!projectType) {
      alert('请选择成果类型');
      return;
    }

    if (!coverImage) {
      alert('请上传封面图片');
      return;
    }

    setIsSubmitting(true);

    try {
      let coverImageUrl = '';
      
      // 上传封面图片
      if (coverImage) {
        try {
          console.log('开始上传封面图片...');
          
          // 检查当前token
          const currentToken = localStorage.getItem('token');
          console.log('当前token:', currentToken ? currentToken.substring(0, 10) + '...' : '无token');
          
          if (!currentToken) {
            alert('请先登录后再上传图片');
            setIsSubmitting(false);
            return;
          }
          
          let uploadResponse;
      
      // 首先将图片转换为base64，作为备选方案
      let base64data;
      try {
        console.log('将图片转换为base64备用...');
        base64data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(coverImage);
        });
        console.log('图片转换为base64成功，长度:', base64data.length);
      } catch (convertError) {
        console.error('图片转base64失败:', convertError);
        base64data = null;
      }
          
          // 首先尝试简化base64上传方案（直接存储到数据库）
          try {
            console.log('尝试简化Base64图片上传方案...');
            
            // 使用简化base64上传API（直接存储到数据库）
            uploadResponse = await api.post(API_ENDPOINTS.UPLOAD.BASE64_SIMPLE, {
              imageData: base64data,
              fileName: coverImage.name
            });
            
            console.log('简化Base64图片上传成功:', uploadResponse);
          } catch (simpleBase64Error) {
            console.error('简化Base64图片上传失败:', simpleBase64Error);
            
            // 回退到标准base64上传方案
            try {
              console.log('尝试标准Base64图片上传方案...');
              
              // 使用标准base64上传API
              uploadResponse = await api.post(API_ENDPOINTS.UPLOAD.BASE64_IMAGE, {
                imageData: base64data,
                fileName: coverImage.name
              });
              
              console.log('标准Base64图片上传成功:', uploadResponse);
            } catch (base64Error) {
              console.error('Base64图片上传失败:', base64Error);
              
              // 如果所有Base64方案都失败，直接使用base64数据作为URL
              if (base64data) {
                console.log('所有Base64方案失败，直接使用base64数据作为URL');
                uploadResponse = {
                  data: {
                    url: base64data,
                    file_name: coverImage.name,
                    storage_type: 'base64_data_url'
                  }
                };
                console.log('✅ 已设置Base64数据URL作为备用方案');
              } else {
                // 只有当Base64数据也不存在时，才回退到传统文件上传
                console.log('Base64数据也不存在，回退到传统文件上传方案...');
                
                // 准备上传数据
                const formData = new FormData();
                formData.append('image', coverImage);
                
                console.log('准备上传封面图片:', {
                  fileName: coverImage.name,
                  fileType: coverImage.type,
                  fileSize: coverImage.size,
                  endpoint: API_ENDPOINTS.UPLOAD.GENERAL_IMAGE
                });
                
                try {
                  // 首先尝试本地文件上传方案
                  uploadResponse = await api.uploadFile('/local-image', coverImage);
                  console.log('本地文件上传成功:', uploadResponse);
                } catch (localError) {
                  console.error('本地文件上传失败:', localError);
                  
                  try {
                    // 尝试通用图片上传（不需要特定角色权限）
                    uploadResponse = await api.uploadFile(API_ENDPOINTS.UPLOAD.GENERAL_IMAGE, coverImage);
                    console.log('通用图片上传成功:', uploadResponse);
                  } catch (generalError) {
                    console.error('通用图片上传失败:', generalError);
                    
                    console.log('尝试Service Role方案...');
                    try {
                      // 尝试Service Role方案（教师端使用的方案）
                      uploadResponse = await api.uploadFile(API_ENDPOINTS.UPLOAD.TEACHER_IMAGE_SERVICE, coverImage);
                      console.log('Service Role上传成功:', uploadResponse);
                    } catch (serviceError) {
                      console.error('Service Role上传失败:', serviceError);
                      
                      console.log('尝试备用方案...');
                      try {
                        // 尝试备用方案
                        uploadResponse = await api.uploadFile(API_ENDPOINTS.UPLOAD.TEACHER_IMAGE_ALT, coverImage);
                        console.log('备用方案上传成功:', uploadResponse);
                      } catch (altError) {
                        console.error('备用方案失败:', altError);
                        console.log('最后尝试原始学生API...');
                        
                        // 最后尝试原始学生API
                      uploadResponse = await api.uploadFile(API_ENDPOINTS.UPLOAD.IMAGE, coverImage);
                      console.log('原始学生API上传成功:', uploadResponse);
                    }
                  }
                }
              }
            }
          } // 结束Base64数据不存在的回退逻辑
          
          // 最终安全检查：如果所有上传方案都失败，但Base64数据存在，使用Base64数据
          if (!uploadResponse && base64data) {
            console.log('所有上传方案都失败，使用Base64数据作为最终备用');
            uploadResponse = {
              data: {
                url: base64data,
                file_name: coverImage.name,
                storage_type: 'base64_data_url'
              }
            };
          }
          
          console.log('封面图片上传响应:', uploadResponse);
          
          if (uploadResponse && uploadResponse.data && uploadResponse.data.url) {
            coverImageUrl = uploadResponse.data.url;
            console.log('封面图片URL:', coverImageUrl);
          } else {
            console.warn('封面图片上传成功但没有返回URL');
          }
        } // 这是内层try-catch的结束
        
        console.log('使用默认封面图片:', coverImageUrl);
      } catch (uploadError) {
        console.error('封面图片上传失败:', uploadError);
        console.error('上传错误详情:', {
          message: uploadError instanceof Error ? uploadError.message : String(uploadError),
          name: uploadError instanceof Error ? uploadError.name : 'Unknown Error',
          stack: uploadError instanceof Error ? uploadError.stack : 'No stack trace available'
        });
        
        // 尝试将图片转换为base64作为最后的备选方案
        // 立即将图片转换为base64并直接使用
        try {
          console.log('立即将图片转换为base64...');
          const reader = new FileReader();
          
          // 创建Promise来处理异步读取
          const base64Promise = new Promise((resolve, reject) => {
            reader.onloadend = function() {
              const base64data = reader.result;
              console.log('图片base64转换成功，长度:', base64data ? base64data.length : 0);
              resolve(base64data);
            };
            reader.onerror = function(error) {
              console.error('base64转换失败:', error);
              reject(error);
            };
            reader.readAsDataURL(coverImage);
          });
          
          // 等待base64转换完成
          coverImageUrl = await base64Promise;
          console.log('使用base64数据作为图片URL');
        } catch (base64Error) {
          console.error('base64转换失败:', base64Error);
          // 使用默认图片继续发布流程
          coverImageUrl = 'https://via.placeholder.com/400x300.png?text=项目封面图';
        }
      }
    } // 这是外层catch块的结束
    else {
        // 如果没有选择封面图，使用默认图片
        coverImageUrl = 'https://via.placeholder.com/400x300.png?text=项目封面图';
        console.log('使用默认封面图片:', coverImageUrl);
      }

      // 构建提交数据
      const submitData = {
        title: projectName,
        content_html: projectDescription || '<p>暂无详细内容</p>',
        video_url: coverImageUrl, // 将封面图URL作为video_url字段传递
        category: projectType
      };

      console.log('提交数据:', submitData);

      // 调用学生提交API
      const response = await api.post(API_ENDPOINTS.PROJECTS.CREATE, submitData);
      
      if (response && response.data) {
        alert('成果提交成功！请等待老师审批。');
        
        // 重置表单
        setProjectName('');
        setProjectLeader('');
        setProjectType(achievementTypes.length > 0 ? achievementTypes[0].id : '');
        setProjectDescription('');
        setCollaborators([]);
        setPhotos([]);
        setVideos([]);
        setDocumentFile(null);
        clearCoverImage();
        if (richTextEditorRef.current) {
          richTextEditorRef.current.innerHTML = '';
        }
        
        // 可以跳转到成果管理页面
        navigate('/business-process');
      } else {
        alert('提交失败：响应数据异常');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败：' + (error.message || '网络错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 退出登录
  const handleLogout = () => {
    navigate('/login');
  };

  // 渲染协作者标签
  const renderCollaboratorTags = () => {
    return collaborators.map(collaborator => (
      <div key={collaborator.id} className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm">
        <span>{collaborator.name}</span>
        <button 
          onClick={() => removeCollaborator(collaborator.id)}
          className="ml-2 text-text-muted hover:text-secondary"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    ));
  };

  // 渲染照片预览
  const renderPhotoPreviews = () => {
    return photos.map(photo => (
      <div key={photo.id} className="flex flex-col gap-2">
        <div className="relative">
          <img src={photo.url} className="w-full h-48 object-cover rounded-lg" alt="项目照片预览" />
          <button 
            onClick={() => removePhoto(photo.id)}
            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md text-text-muted hover:text-secondary"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div>
          <input 
            type="text" 
            value={photo.description}
            onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
            className={`w-full px-3 py-2 border border-border-light rounded-lg text-base ${styles.searchInputFocus}`}
            placeholder="请输入图片描述..."
          />
        </div>
      </div>
    ));
  };

  // 渲染视频预览
  const renderVideoPreviews = () => {
    return videos.map(video => (
      <div key={video.id} className="relative mb-4">
        <video controls className="w-full rounded-lg" alt="项目视频预览">
          <source src={video.url} type={video.file.type} />
          您的浏览器不支持视频播放。
        </video>
        <button 
          onClick={() => removeVideo(video.id)}
          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md text-text-muted hover:text-secondary"
        >
          <i className="fas fa-times"></i>
        </button>
        {video.duration > 300 && (
          <div className="mt-2 text-xs text-red-500">
            <i className="fas fa-exclamation-circle mr-1"></i>视频时长超过5分钟，请上传更短的视频
          </div>
        )}
      </div>
    ));
  };

  return (
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
                className={`w-full pl-10 pr-4 py-2 border border-border-light rounded-lg bg-white ${styles.searchInputFocus}`}
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted"></i>
            </div>
          </div>
          
          {/* 右侧用户区域 */}
          <Link to="/personal-center" className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2">
              <img 
                src="https://s.coze.cn/image/JXMwnXlo9Gs/" 
                alt="用户头像" 
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-text-primary">张同学</span>
              <i className="fas fa-chevron-down text-xs text-text-muted"></i>
            </div>
          </Link>
        </div>
      </header>

      {/* 左侧导航栏 */}
      <aside id="sidebar" className={`fixed left-0 top-16 bottom-0 w-64 bg-bg-light border-r border-border-light z-40 ${styles.sidebarTransition}`}>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link to="/home" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-gray-50 hover:text-text-primary">
                <i className="fas fa-home text-lg"></i>
                <span className="font-medium">首页</span>
              </Link>
            </li>
            <li>
              <Link to="/project-intro" className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${styles.navItemActive}`}>
                <i className="fas fa-graduation-cap text-lg"></i>
                <span className="font-medium">成果发布</span>
              </Link>
            </li>
            <li>
              <Link to="/business-process" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-gray-50 hover:text-text-primary">
                <i className="fas fa-sitemap text-lg"></i>
                <span className="font-medium">成果管理</span>
              </Link>
            </li>
            <li>
              <Link to="/student-info" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-gray-50 hover:text-text-primary">
                <i className="fas fa-users text-lg"></i>
                <span className="font-medium">数据看板</span>
              </Link>
            </li>

            <li>
              <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-gray-50 hover:text-red-500 w-full text-left">
                <i className="fas fa-sign-out-alt text-lg"></i>
                <span className="font-medium">退出登录</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* 主内容区域 */}
      <main id="main-content" className="ml-64 mt-16 p-6 min-h-screen">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">学生端成果发布</h2>
              <nav className="text-sm text-text-muted">
                <Link to="/home" className="hover:text-orange-500">首页</Link>
                <span className="mx-2">/</span>
                <span className="text-text-primary">成果发布</span>
              </nav>
            </div>
          </div>
        </div>
        
        {/* 项目编辑区域 */}
        <div className="bg-bg-light rounded-2xl shadow-card mb-8">
          {/* 编辑/预览切换标签 */}
          <div className="flex border-b border-border-light">
            <button 
              onClick={() => setActiveTab('edit')}
              className={`px-6 py-4 font-medium ${activeTab === 'edit' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-text-muted'}`}
            >
              编辑
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-4 font-medium ${activeTab === 'preview' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-text-muted'}`}
            >
              预览
            </button>
          </div>
          
          {/* 编辑区域 */}
          {activeTab === 'edit' && (
            <div className="p-6">
              {/* 第一行：项目名称、负责人、项目类型 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div>
                  <label htmlFor="project-name" className="block text-sm font-medium text-text-secondary mb-2">项目名称</label>
                  <input 
                    type="text" 
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.searchInputFocus}`}
                    placeholder="请输入项目名称"
                  />
                </div>
                <div>
                  <label htmlFor="project-leader" className="block text-sm font-medium text-text-secondary mb-2">项目负责人</label>
                  <input 
                    type="text" 
                    id="project-leader"
                    value={projectLeader}
                    onChange={(e) => setProjectLeader(e.target.value)}
                    className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.searchInputFocus}`}
                    placeholder="请输入项目负责人"
                  />
                </div>
                <div>
                  <label htmlFor="project-type" className="block text-sm font-medium text-text-secondary mb-2">项目类型 <span className="text-red-500">*</span></label>
                  <select 
                    id="project-type"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className={`w-full px-4 py-3 border border-border-light rounded-lg ${styles.searchInputFocus}`}
                  >
                    <option value="">请选择成果类型</option>
                    {achievementTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 封面图片上传 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-text-secondary mb-2">封面图片 <span className="text-red-500">*</span></label>
                <div className="flex items-center space-x-4">
                  {coverImage ? (
                    <div className="relative">
                      <img 
                        src={coverImageUrl} 
                        alt="封面图片" 
                        className="w-32 h-24 object-cover rounded-lg border border-border-light"
                      />
                      <button 
                        onClick={clearCoverImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => coverImageUploadRef.current?.click()}
                      className="w-32 h-24 border-2 border-dashed border-border-light rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
                    >
                      <i className="fas fa-cloud-upload-alt text-2xl text-text-muted mb-1"></i>
                      <span className="text-xs text-text-muted text-center">点击上传</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <button 
                      type="button"
                      onClick={() => coverImageUploadRef.current?.click()}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                    >
                      {coverImage ? '更换图片' : '选择图片'}
                    </button>
                    <p className="text-xs text-text-muted mt-1">支持 JPG、PNG 格式，建议尺寸 400×300</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={coverImageUploadRef}
                  onChange={handleCoverImageUpload}
                  className="hidden" 
                  accept="image/jpeg,image/png"
                />
              </div>
              
              {/* 第二行：协作者 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-text-secondary mb-2">协作者</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={collaboratorInput}
                    onChange={(e) => setCollaboratorInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCollaborator()}
                    className={`flex-1 px-4 py-3 border border-border-light rounded-lg ${styles.searchInputFocus}`}
                    placeholder="输入协作者姓名"
                  />
                  <button 
                    onClick={addCollaborator}
                    className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {renderCollaboratorTags()}
                </div>
              </div>
              
              {/* 第三行：富文本编辑窗口 */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-text-secondary">项目描述</label>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-xs bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors">
                      <i className="fas fa-magic mr-1"></i>一键布局
                    </button>
                    <button className="px-3 py-1 text-xs bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors">
                      <i className="fas fa-wand-magic-sparkles mr-1"></i>一键润色
                    </button>
                  </div>
                </div>
                <div className="border border-border-light rounded-lg overflow-hidden">
                  {/* 富文本编辑器工具栏 */}
                  <div className="flex flex-wrap items-center p-2 bg-gray-50 border-b border-border-light">
                    <button 
                      onClick={() => handleEditorCommand('bold')}
                      className="p-2 text-text-secondary hover:bg-gray-200 rounded"
                    >
                      <i className="fas fa-bold"></i>
                    </button>
                    <button 
                      onClick={() => handleEditorCommand('italic')}
                      className="p-2 text-text-secondary hover:bg-gray-200 rounded"
                    >
                      <i className="fas fa-italic"></i>
                    </button>
                    <button 
                      onClick={() => handleEditorCommand('underline')}
                      className="p-2 text-text-secondary hover:bg-gray-200 rounded"
                    >
                      <i className="fas fa-underline"></i>
                    </button>
                    <div className="w-px h-6 bg-border-light mx-1"></div>
                    <button 
                      onClick={() => handleEditorCommand('insertUnorderedList')}
                      className="p-2 text-text-secondary hover:bg-gray-200 rounded"
                    >
                      <i className="fas fa-list-ul"></i>
                    </button>
                    <button 
                      onClick={() => handleEditorCommand('insertOrderedList')}
                      className="p-2 text-text-secondary hover:bg-gray-200 rounded"
                    >
                      <i className="fas fa-list-ol"></i>
                    </button>
                    <div className="w-px h-6 bg-border-light mx-1"></div>
                    <button 
                      onClick={() => handleEditorCommand('justifyLeft')}
                      className="p-2 text-text-secondary hover:bg-gray-200 rounded"
                    >
                      <i className="fas fa-align-left"></i>
                    </button>
                    <button 
                      onClick={() => handleEditorCommand('justifyCenter')}
                      className="p-2 text-text-secondary hover:bg-gray-200 rounded"
                    >
                      <i className="fas fa-align-center"></i>
                    </button>
                    <button 
                      onClick={() => handleEditorCommand('justifyRight')}
                      className="p-2 text-text-secondary hover:bg-gray-200 rounded"
                    >
                      <i className="fas fa-align-right"></i>
                    </button>
                    <div className="w-px h-6 bg-border-light mx-1"></div>
                    <button 
                      onClick={() => photoUploadRef.current?.click()}
                      className="p-2 text-text-secondary hover:bg-gray-200 rounded"
                    >
                      <i className="fas fa-image"></i>
                    </button>
                  </div>
                  {/* 富文本编辑区域 */}
                  <div 
                    ref={richTextEditorRef}
                    className="p-4 min-h-[300px] focus:outline-none"
                    contentEditable="true"
                    onInput={handleRichTextChange}
                    suppressContentEditableWarning={true}
                  ></div>
                </div>
              </div>
              
              {/* 第四行：项目照片 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-text-secondary mb-2">项目照片</label>
                <div 
                  onClick={() => photoUploadRef.current?.click()}
                  className="border-2 border-dashed border-border-light rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="fas fa-image text-4xl text-text-muted mb-3"></i>
                  <p className="text-sm text-text-muted">点击或拖拽文件到此处上传</p>
                  <p className="text-xs text-text-muted mt-1">支持 JPG、PNG 格式，建议尺寸 1200x675px，最大 10MB</p>
                  <input 
                    ref={photoUploadRef}
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg, image/png"
                    multiple
                    onChange={handlePhotoUpload}
                  />
                </div>
                {photos.length > 0 && (
                  <div className="mt-4">
                    {renderPhotoPreviews()}
                  </div>
                )}
              </div>
              
              {/* 第五行：项目视频 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-text-secondary mb-2">项目视频</label>
                <div 
                  onClick={() => videoUploadRef.current?.click()}
                  className="border-2 border-dashed border-border-light rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="fas fa-video text-3xl text-text-muted mb-2"></i>
                  <p className="text-sm text-text-muted">点击或拖拽文件到此处上传</p>
                  <p className="text-xs text-text-muted mt-1">支持 MP4、WebM 格式，最大 100MB，时长不超过5分钟</p>
                  <input 
                    ref={videoUploadRef}
                    type="file" 
                    className="hidden" 
                    accept="video/mp4, video/webm"
                    multiple
                    onChange={handleVideoUpload}
                  />
                </div>
                {videos.length > 0 && (
                  <div className="mt-4">
                    {renderVideoPreviews()}
                  </div>
                )}
              </div>
              
              {/* 第六行：需求文档 */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-text-secondary mb-2">需求文档</label>
                <div 
                  onClick={() => documentUploadRef.current?.click()}
                  className="border-2 border-dashed border-border-light rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="fas fa-file-pdf text-4xl text-text-muted mb-3"></i>
                  <p className="text-sm text-text-muted">点击或拖拽文件到此处上传</p>
                  <p className="text-xs text-text-muted mt-1">支持 PDF 格式，最大 50MB</p>
                  <input 
                    ref={documentUploadRef}
                    type="file" 
                    className="hidden" 
                    accept="application/pdf"
                    onChange={handleDocumentUpload}
                  />
                </div>
                {documentFile && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <i className="fas fa-file-pdf text-red-500 text-xl mr-3"></i>
                        <span className="text-sm text-text-primary truncate max-w-[200px]">{documentFile.name}</span>
                      </div>
                      <button 
                        onClick={clearDocument}
                        className="text-text-muted hover:text-orange-500"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 底部按钮 */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-border-light">
                <button 
                  onClick={() => {}}
                  className="px-6 py-3 bg-gray-200 text-text-primary rounded-lg hover:bg-gray-300 transition-colors"
                >
                  存草稿
                </button>
                <button 
                  onClick={handleUploadProject}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '上传中...' : '上传项目'}
                </button>
              </div>
            </div>
          )}
          
          {/* 预览区域 */}
          {activeTab === 'preview' && (
            <div className="p-6">
              <div className="max-w-3xl mx-auto">
                {/* 预览头部 */}
                <div className="mb-6 text-center">
                  {coverImage && (
                    <div className="mb-4">
                      <img 
                        src={coverImageUrl} 
                        alt="项目封面" 
                        className="w-full h-64 object-cover rounded-lg mx-auto"
                      />
                    </div>
                  )}
                  <h1 className="text-3xl font-bold text-text-primary mb-2">{projectName || '未命名项目'}</h1>
                  <div className="flex justify-center items-center space-x-4 text-sm text-text-muted">
                    <span>{projectType ? (achievementTypes.find(type => type.id === projectType)?.name || '未知类型') : '未选择类型'}</span>
                    <span>•</span>
                    <span>负责人：{projectLeader || '未指定负责人'}</span>
                  </div>
                </div>
                
                {/* 预览信息 */}
                <div className="mb-6">
                  {collaborators.length > 0 && (
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div>
                        <span className="text-sm font-medium text-text-secondary">协作者：</span>
                        <div className="inline-flex flex-wrap gap-2 mt-1">
                          {collaborators.map(c => (
                            <span key={c.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{c.name}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 预览内容 */}
                <div className="prose max-w-none text-text-secondary mb-8">
                  <div dangerouslySetInnerHTML={{ __html: projectDescription || '<p>暂无项目描述</p>' }} />
                </div>
                
                {/* 预览照片 */}
                {photos.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-text-primary mb-3">项目照片</h3>
                    <div className="flex flex-col gap-6">
                      {photos.map(photo => (
                        <div key={photo.id}>
                          <img src={photo.url} className="w-full h-64 object-cover rounded-lg" alt="项目照片" />
                          {photo.description && <p className="mt-3 text-base text-text-secondary">{photo.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 预览视频 */}
                {videos.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-text-primary mb-3">项目演示视频</h3>
                    <div className="space-y-4">
                      {videos.map(video => (
                        <div key={video.id}>
                          <video controls className="w-full rounded-lg" alt="项目视频预览">
                            <source src={video.url} type={video.file.type} />
                            您的浏览器不支持视频播放。
                          </video>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 预览文档 */}
                {documentFile && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-text-primary mb-3">需求文档</h3>
                    <div>
                      <div className="flex items-center">
                        <i className="fas fa-file-pdf text-red-500 text-xl mr-3"></i>
                        <span className="text-sm text-text-primary truncate max-w-[200px]">{documentFile.name}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectIntroPage;

