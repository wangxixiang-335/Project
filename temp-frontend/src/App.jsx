import React, { useState, useEffect } from 'react'
import axios from 'axios'
import StudentHomepage from './components/StudentHomepage'
import NavigationMenu from './components/NavigationMenu'
import ProjectManagement from './components/ProjectManagement'
import EnhancedDashboard from './components/EnhancedDashboard'
import TeacherHomepage from './components/TeacherHomepage'
import TeacherApproval from './components/TeacherApproval'
import TeacherPublish from './components/TeacherPublish'
import TeacherManage from './components/TeacherManage'
import TeacherLibrary from './components/TeacherLibrary'
import TeacherDashboard from './components/TeacherDashboard'
import './components/StudentHomepage.css'
import './components/NavigationMenu.css'
import './components/ProjectManagement.css'
import './components/EnhancedDashboard.css'
import './components/TeacherHomepage.css'
import './components/TeacherApproval.css'
import './components/TeacherPublish.css'
import './components/TeacherManage.css'
import './components/TeacherLibrary.css'
import './components/TeacherDashboard.css'

const API_BASE = '/api'

function App() {
  const [activeTab, setActiveTab] = useState('login')
  const [studentTab, setStudentTab] = useState('home') // 学生专用标签页
  const [user, setUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [teacherStats, setTeacherStats] = useState({}) // 添加教师统计状态
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [studentStats, setStudentStats] = useState(null)

  // 登录表单状态
  const [loginForm, setLoginForm] = useState({
    email: 'studentdemo@example.com',
    password: 'demo123456'
  })

  // 注册表单状态
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    username: '',
    role: 'student'
  })

  // 项目表单状态
  const [projectForm, setProjectForm] = useState({
    title: '',
    content_html: '',
    video_url: ''
  })

  // 检查本地存储的token
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken')
    if (token) {
      checkAuth()
    }
  }, [])

  // 验证用户身份
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken')
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        const userData = response.data.data
        setUser(userData)
        
        // 根据角色设置正确的默认页面
        if (userData.role === 'teacher') {
          setActiveTab('teacher-home')
        } else {
          setStudentTab('home')
          setActiveTab('projects')
        }
      }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('teacherToken')
      sessionStorage.removeItem('teacherToken')
      setUser(null)
    }
  }

  // 显示消息
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  // 用户登录
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, loginForm)
      if (response.data.success) {
        const token = response.data.data.token
        const userData = response.data.data
        
        // 根据用户角色存储token
        if (userData.role === 'teacher') {
          localStorage.setItem('teacherToken', token)
          localStorage.setItem('token', token) // 同时设置通用的token键
        } else {
          localStorage.setItem('token', token)
        }
        
        setUser(userData)
        showMessage('success', '登录成功！')
        
        // 根据角色跳转到相应页面
        if (userData.role === 'teacher') {
          setActiveTab('teacher-home')
        } else {
          setStudentTab('home') // 学生跳转到首页
          setActiveTab('projects') // 保持activeTab为projects
        }
      }
    } catch (error) {
      showMessage('error', error.response?.data?.error || '登录失败')
    }
    setLoading(false)
  }

  // 用户注册
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, registerForm)
      if (response.data.success) {
        showMessage('success', '注册成功！请登录')
        setActiveTab('login')
        setRegisterForm({ email: '', password: '', username: '', role: 'student' })
      }
    } catch (error) {
      showMessage('error', error.response?.data?.error || '注册失败')
    }
    setLoading(false)
  }

  // 获取项目列表（学生）
  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setProjects(response.data.data.items || [])
      }
    } catch (error) {
      showMessage('error', '获取项目失败')
    }
  }

  // 获取项目详细信息
  const loadProjectDetail = async (projectId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      showMessage('error', '获取项目详情失败')
      return null
    }
  }

  // 获取学生统计信息
  const loadStudentStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/stats/student`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        return response.data.data
      }
    } catch (error) {
      showMessage('error', '获取统计信息失败')
      return null
    }
  }

  // 获取所有项目（教师）
  const loadAllProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/teacher/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 50 }
      })
      if (response.data.success) {
        setProjects(response.data.data.items || [])
      }
    } catch (error) {
      showMessage('error', '获取项目列表失败')
    }
  }

  // 获取待审核项目（教师）
  const loadPendingProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/review/pending`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 50 }
      })
      console.log('待审核项目API响应:', response.data)
      if (response.data.success) {
        setProjects(response.data.data.items || [])
      }
    } catch (error) {
      console.error('获取待审核项目失败:', error)
      showMessage('error', error.response?.data?.error || '获取待审核项目失败')
    }
  }

  // 教师评审项目 - 使用review路由
  const handleReviewProject = async (projectId, status, feedback = '') => {
    try {
      const token = localStorage.getItem('token')
      console.log('审核请求参数:', { projectId, status, feedback })
      
      const response = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
        audit_result: status, // 使用数字1或2
        reject_reason: status === 2 ? feedback : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        showMessage('success', '评审成功')
        // 刷新当前页面数据
        if (activeTab === 'review') {
          loadPendingProjects()
        } else if (activeTab === 'teacher-approval') {
          // 教师审批页面的刷新逻辑将在组件内部处理
        }
      }
    } catch (error) {
      console.error('评审项目错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      showMessage('error', error.response?.data?.error || '评审失败')
    }
  }

  // 获取教师统计信息
  const loadTeacherStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/teacher/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setTeacherStats(response.data.data || {})
      }
    } catch (error) {
      console.error('获取教师统计信息失败:', error)
      showMessage('error', '获取统计信息失败')
    }
  }

  // 提交项目
  const handleSubmitProject = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_BASE}/projects`, projectForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        showMessage('success', '项目提交成功！')
        setProjectForm({ title: '', content_html: '', video_url: '' })
        loadProjects()
      }
    } catch (error) {
      showMessage('error', error.response?.data?.error || '提交失败')
    }
    setLoading(false)
  }

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('teacherToken')
    sessionStorage.removeItem('teacherToken')
    setUser(null)
    setProjects([])
    setActiveTab('login')
    showMessage('success', '已退出登录')
  }

  // 加载项目列表
  useEffect(() => {
    if (user) {
      if (user.role === 'student') {
        if (studentTab === 'manage' || activeTab === 'projects') {
          loadProjects()
        } else if (studentTab === 'dashboard' || activeTab === 'stats') {
          // 加载学生统计信息
          loadStudentStats().then(stats => {
            if (stats) setStudentStats(stats)
          })
        }
      } else {
        // 教师角色的数据加载将在各个组件内部处理
        if (activeTab === 'review') {
          loadPendingProjects()
        } else if (activeTab === 'all-projects') {
          loadAllProjects()
        } else if (activeTab === 'teacher-stats') {
          loadTeacherStats()
        }
      }
    }
  }, [user, activeTab, studentTab])

  return (
    <div className="container">
      <h1>学生项目展示系统 - 临时前端</h1>
      
      {message.text && (
        <div className={message.type === 'error' ? 'error' : 'success'}>
          {message.text}
        </div>
      )}

      {user ? (
        <div>
          {/* 顶部用户信息栏 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px',
            padding: '16px 20px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '16px', color: '#333' }}>
              欢迎,<strong>{user.username}</strong> ({user.role === 'student' ? '学生' : '教师'})
            </div>
            <button className="btn" onClick={handleLogout} style={{ background: '#dc3545', color: 'white' }}>退出登录</button>
          </div>

          {/* 导航菜单 */}
          <NavigationMenu 
            activeTab={user.role === 'student' ? studentTab : activeTab}
            setActiveTab={user.role === 'student' ? setStudentTab : setActiveTab}
            userRole={user.role}
          />

          {/* 学生界面 - 使用新的导航和内容结构 */}
          {user.role === 'student' && (
            <>
              {studentTab === 'home' && (
                <StudentHomepage user={user} />
              )}
              
              {studentTab === 'publish' && (
                <div className="content-section">
                  <h2>成果发布</h2>
                  <form onSubmit={handleSubmitProject}>
                    <div className="form-group">
                      <label>项目标题 *</label>
                      <input 
                        type="text" 
                        value={projectForm.title}
                        onChange={e => setProjectForm({...projectForm, title: e.target.value})}
                        required 
                      />
                      <small>标题是必填项</small>
                    </div>
                    <div className="form-group">
                      <label>项目内容 (HTML格式)</label>
                      <textarea 
                        value={projectForm.content_html}
                        onChange={e => setProjectForm({...projectForm, content_html: e.target.value})}
                        rows="6"
                        placeholder="可填写项目描述、技术实现等HTML内容"
                      />
                      <small>可填写任意HTML内容（可选）</small>
                    </div>
                    <div className="form-group">
                      <label>视频URL</label>
                      <input 
                        type="text" 
                        value={projectForm.video_url}
                        onChange={e => setProjectForm({...projectForm, video_url: e.target.value})}
                        placeholder="例如: https://xxx.supabase.co/storage/..."
                      />
                      <small>可填写视频链接（可选）</small>
                    </div>
                    <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                      <p><strong>提示：</strong>请至少填写<strong>项目内容</strong>或<strong>视频URL</strong>其中一项</p>
                    </div>
                    <button type="submit" className="btn" disabled={loading}>
                      {loading ? '提交中...' : '提交项目'}
                    </button>
                  </form>
                </div>
              )}
              
              {studentTab === 'manage' && (
                <ProjectManagement user={user} />
              )}
              
              {studentTab === 'dashboard' && (
                <EnhancedDashboard user={user} />
              )}
            </>
          )}

          {/* 教师专用界面 - 新设计 */}
          {user.role === 'teacher' && (
            <>
              {activeTab === 'teacher-home' && (
                <TeacherHomepage user={user} />
              )}
              
              {activeTab === 'teacher-approval' && (
                <TeacherApproval user={user} />
              )}
              
              {activeTab === 'teacher-publish' && (
                <TeacherPublish user={user} />
              )}
              
              {activeTab === 'teacher-manage' && (
                <TeacherManage user={user} />
              )}
              
              {activeTab === 'teacher-library' && (
                <TeacherLibrary user={user} />
              )}
              
              {activeTab === 'teacher-dashboard' && (
                <TeacherDashboard user={user} />
              )}
            </>
          )}
        </div>
      ) : (
        <div>
          <div className="nav">
            <button 
              className={activeTab === 'login' ? 'active' : ''}
              onClick={() => setActiveTab('login')}
            >
              登录
            </button>
            <button 
              className={activeTab === 'register' ? 'active' : ''}
              onClick={() => setActiveTab('register')}
            >
              注册
            </button>
          </div>

          {activeTab === 'login' && (
            <form onSubmit={handleLogin}>
              <h2>用户登录</h2>
              <div className="form-group">
                <label>邮箱</label>
                <input 
                  type="email" 
                  value={loginForm.email}
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>密码</label>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  required 
                />
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{marginLeft: '10px', background: '#28a745'}}
                onClick={() => {
                  // 设置开发者模式
                  const devUser = {
                    id: 'dev-teacher-id',
                    email: 'dev-teacher@example.com',
                    role: 'teacher',
                    username: 'dev-teacher'
                  };
                  localStorage.setItem('teacherToken', 'dev-teacher-token');
                  localStorage.setItem('token', 'dev-teacher-token');
                  localStorage.setItem('user', JSON.stringify(devUser));
                  setUser(devUser);
                  setActiveTab('teacher-home');
                  showMessage('success', '开发者模式已激活！');
                }}
              >
                开发者模式(教师)
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister}>
              <h2>用户注册</h2>
              <div className="form-group">
                <label>邮箱</label>
                <input 
                  type="email" 
                  value={registerForm.email}
                  onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>密码</label>
                <input 
                  type="password" 
                  value={registerForm.password}
                  onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>用户名</label>
                <input 
                  type="text" 
                  value={registerForm.username}
                  onChange={e => setRegisterForm({...registerForm, username: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>角色</label>
                <select 
                  value={registerForm.role}
                  onChange={e => setRegisterForm({...registerForm, role: e.target.value})}
                >
                  <option value="student">学生</option>
                  <option value="teacher">教师</option>
                </select>
              </div>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? '注册中...' : '注册'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* 项目详情模态框 */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>项目详情</h2>
              <button className="modal-close" onClick={() => setSelectedProject(null)}>×</button>
            </div>
            <div className="modal-body">
              <h3>{selectedProject.title}</h3>
              
              {selectedProject.content_html && (
                <div className="project-detail-section">
                  <h4>项目内容：</h4>
                  <div dangerouslySetInnerHTML={{ __html: selectedProject.content_html }} />
                </div>
              )}
              
              {selectedProject.video_url && (
                <div className="project-detail-section">
                  <h4>项目视频：</h4>
                  <a href={selectedProject.video_url} target="_blank" rel="noopener noreferrer">
                    点击查看视频
                  </a>
                </div>
              )}
              
              <div className="project-meta">
                <p><strong>状态：</strong> 
                  {selectedProject.status === 0 ? '待审核' : 
                   selectedProject.status === 1 ? '已通过' : '已打回'}
                </p>
                <p><strong>创建时间：</strong> {new Date(selectedProject.created_at).toLocaleString()}</p>
                <p><strong>浏览量：</strong> {selectedProject.view_count || 0}</p>
                
                {selectedProject.feedback && (
                  <p><strong>评审意见：</strong> {selectedProject.feedback}</p>
                )}
                
                {selectedProject.audit_result && (
                  <p><strong>审核结果：</strong> {selectedProject.audit_result}</p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setSelectedProject(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App