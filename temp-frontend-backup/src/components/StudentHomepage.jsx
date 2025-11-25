import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

const StudentHomepage = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('approved'); // 'approved' or 'rejected'
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    avatar: '',
    signature: ''
  });
  const [editingProfile, setEditingProfile] = useState(false);

  // 获取通知列表
  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // 处理简化后的数据结构
        const notificationsData = response.data.data || [];
        const validNotifications = notificationsData.filter(n => n && n.id);
        setNotifications(validNotifications);
      }
    } catch (error) {
      console.error('获取通知失败:', error);
      setNotifications([]); // 出错时设置为空数组
    } finally {
      setLoading(false);
    }
  };

  // 获取用户资料
  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUserProfile({
          avatar: response.data.data.avatar || '',
          signature: response.data.data.signature || ''
        });
      }
    } catch (error) {
      console.error('获取用户资料失败:', error);
    }
  };

  // 清除单个通知
  const clearNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('清除通知失败:', error);
    }
  };

  // 清除所有通知
  const clearAllNotifications = async () => {
    if (!window.confirm('确定要清除所有通知吗？')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'approved') return n.status === 1;
        if (activeTab === 'rejected') return n.status === 2;
        return false;
      });

      // 批量清除
      await Promise.all(
        filteredNotifications.map(n => 
          axios.delete(`${API_BASE}/notifications/${n.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      
      setNotifications(prev => prev.filter(n => {
        if (activeTab === 'approved') return n.status !== 1;
        if (activeTab === 'rejected') return n.status !== 2;
        return true;
      }));
    } catch (error) {
      console.error('清除所有通知失败:', error);
    }
  };

  // 更新用户资料
  const updateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE}/users/profile`, userProfile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setEditingProfile(false);
        alert('资料更新成功！');
      }
    } catch (error) {
      console.error('更新资料失败:', error);
      alert('更新资料失败');
    }
  };

  useEffect(() => {
    loadNotifications();
    loadUserProfile();
  }, []);

  // 过滤通知
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'approved') return notification.status === 1;
    if (activeTab === 'rejected') return notification.status === 2;
    return false;
  });

  return (
    <div className="student-homepage">
      {/* 账户信息区域 */}
      <div className="account-section">
        <div className="account-header">
          <h2>账户信息</h2>
          <button 
            className="edit-profile-btn"
            onClick={() => setEditingProfile(!editingProfile)}
          >
            {editingProfile ? '取消' : '编辑资料'}
          </button>
        </div>
        
        <div className="account-info">
          <div className="avatar-section">
            {editingProfile ? (
              <div className="avatar-edit">
                <input
                  type="text"
                  placeholder="头像URL"
                  value={userProfile.avatar}
                  onChange={(e) => setUserProfile({...userProfile, avatar: e.target.value})}
                />
                <div className="avatar-preview">
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="头像预览" />
                  ) : (
                    <div className="avatar-placeholder">点击编辑头像</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="avatar-display">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt="用户头像" />
                ) : (
                  <div className="avatar-default">👤</div>
                )}
              </div>
            )}
          </div>
          
          <div className="user-details">
            <h3>{user?.username}</h3>
            {editingProfile ? (
              <div className="signature-edit">
                <textarea
                  placeholder="设置您的个性签名..."
                  value={userProfile.signature}
                  onChange={(e) => setUserProfile({...userProfile, signature: e.target.value})}
                  rows="2"
                />
                <button onClick={updateProfile} className="save-btn">保存</button>
              </div>
            ) : (
              <p className="signature">
                {userProfile.signature || '暂无个性签名'}
              </p>
            )}
            <p className="user-role">身份：学生</p>
          </div>
        </div>
      </div>

      {/* 通知区域 */}
      <div className="notifications-section">
        <div className="notifications-header">
          <h2>通知中心</h2>
          <button 
            className="clear-all-btn"
            onClick={clearAllNotifications}
            disabled={filteredNotifications.length === 0}
          >
            全部清除
          </button>
        </div>

        {/* 通知标签页 */}
        <div className="notification-tabs">
          <button
            className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            通过 ({notifications.filter(n => n.status === 1).length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            驳回 ({notifications.filter(n => n.status === 2).length})
          </button>
        </div>

        {/* 通知列表 */}
        <div className="notifications-list">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClear={clearNotification}
              />
            ))
          ) : (
            <div className="no-notifications">
              <p>暂无{activeTab === 'approved' ? '通过' : '驳回'}通知</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 通知子组件
const NotificationItem = ({ notification, onClear }) => {
  const getStatusIcon = (status) => {
    if (status === 1) {
      return <span className="status-icon approved">✓</span>;
    } else if (status === 2) {
      return <span className="status-icon rejected">✗</span>;
    }
    return null;
  };

  const getStatusText = (status) => {
    if (status === 1) return '通过';
    if (status === 2) return '驳回';
    return '待审核';
  };

  return (
    <div className="notification-item">
      <div className="notification-content">
        {/* 封面图 */}
        <div className="project-cover">
          {notification.project_cover ? (
            <img src={notification.project_cover} alt="项目封面" />
          ) : (
            <div className="cover-placeholder">📄</div>
          )}
        </div>
        
        {/* 通知信息 */}
        <div className="notification-info">
          <h4 className="project-title">{notification.project_title}</h4>
          <div className="notification-details">
            {notification.status === 1 ? (
              <p className="score-info">
                得分：{notification.score || '暂无评分'} 分
              </p>
            ) : (
              <p className="rejection-reason">
                驳回原因：{notification.reject_reason || '未提供具体原因'}
              </p>
            )}
            <p className="notification-time">
              {new Date(notification.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* 状态图标 */}
        <div className="status-icon-container">
          {getStatusIcon(notification.status)}
        </div>
        
        {/* 清除按钮 */}
        <button
          className="clear-notification-btn"
          onClick={() => onClear(notification.id)}
          title="清除此通知"
        >
          <span className="clear-icon">✕</span>
        </button>
      </div>
    </div>
  );
};

export default StudentHomepage;