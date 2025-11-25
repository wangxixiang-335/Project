import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeacherHomepage.css';

const API_BASE = 'http://localhost:3000/api';

const TeacherHomepage = ({ user }) => {
  const [notifications, setNotifications] = useState({
    pending: [],
    approved: [],
    rejected: []
  });
  const [userProfile, setUserProfile] = useState({
    avatar: '',
    signature: '暂无签名'
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // 获取通知数据
  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 获取待审批通知
      const pendingResponse = await axios.get(`${API_BASE}/teacher/notifications/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 获取已通过通知
      const approvedResponse = await axios.get(`${API_BASE}/teacher/notifications/approved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 获取已驳回通知
      const rejectedResponse = await axios.get(`${API_BASE}/teacher/notifications/rejected`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications({
        pending: pendingResponse.data.data || [],
        approved: approvedResponse.data.data || [],
        rejected: rejectedResponse.data.data || []
      });
    } catch (error) {
      console.error('获取通知失败:', error);
      setMessage('获取通知失败');
    } finally {
      setLoading(false);
    }
  };

  // 清除单个通知
  const clearNotification = async (notificationId, type) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/teacher/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 从状态中移除该通知
      setNotifications(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.id !== notificationId)
      }));
      
      setMessage('通知已清除');
    } catch (error) {
      console.error('清除通知失败:', error);
      setMessage('清除通知失败');
    }
  };

  // 清除全部通知
  const clearAllNotifications = async (type) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/teacher/notifications/clear/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => ({
        ...prev,
        [type]: []
      }));
      
      setMessage(`所有${type === 'pending' ? '待审批' : type === 'approved' ? '已通过' : '已驳回'}通知已清除`);
    } catch (error) {
      console.error('清除通知失败:', error);
      setMessage('清除通知失败');
    }
  };

  // 更新用户资料
  const updateProfile = async (field, value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/teacher/profile`, {
        [field]: value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserProfile(prev => ({
        ...prev,
        [field]: value
      }));
      
      setMessage('资料更新成功');
    } catch (error) {
      console.error('更新资料失败:', error);
      setMessage('更新资料失败');
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <span className="status-icon approved">✅</span>;
      case 'rejected':
        return <span className="status-icon rejected">❌</span>;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '待审批';
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已驳回';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="teacher-homepage">
      {message && (
        <div className={`message ${message.includes('失败') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* 账户信息栏 */}
      <div className="account-info-section">
        <div className="account-header">
          <div className="avatar-section">
            <div className="avatar">
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt="头像" />
              ) : (
                <span className="avatar-placeholder">{user.username?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>
            <div className="avatar-controls">
              <input
                type="text"
                placeholder="输入头像URL"
                value={userProfile.avatar}
                onChange={(e) => setUserProfile(prev => ({ ...prev, avatar: e.target.value }))}
                onBlur={(e) => updateProfile('avatar', e.target.value)}
                className="avatar-input"
              />
            </div>
          </div>
          <div className="user-info">
            <h2>欢迎回来，{user.username}</h2>
            <div className="signature-section">
              <input
                type="text"
                placeholder="设置个人签名"
                value={userProfile.signature}
                onChange={(e) => setUserProfile(prev => ({ ...prev, signature: e.target.value }))}
                onBlur={(e) => updateProfile('signature', e.target.value)}
                className="signature-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 通知中心 */}
      <div className="notifications-section">
        <div className="notifications-header">
          <h3>通知中心</h3>
          <div className="notification-tabs">
            <div className={`tab ${activeTab === 'pending' ? 'active' : ''}`}>
              待审批 <span className="count">({notifications.pending.length})</span>
            </div>
            <div className={`tab ${activeTab === 'approved' ? 'active' : ''}`}>
              已通过 <span className="count">({notifications.approved.length})</span>
            </div>
            <div className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}>
              已驳回 <span className="count">({notifications.rejected.length})</span>
            </div>
          </div>
          <div className="tab-actions">
            {activeTab && (
              <button 
                className="clear-all-btn"
                onClick={() => clearAllNotifications(activeTab)}
              >
                全部清除
              </button>
            )}
          </div>
        </div>

        <div className="notifications-content">
          {activeTab && notifications[activeTab].length === 0 ? (
            <div className="no-notifications">
              暂无{getStatusText(activeTab)}通知
            </div>
          ) : (
            <div className="notification-list">
              {activeTab && notifications[activeTab].map(notification => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-left">
                    <div className="cover-image">
                      {notification.cover_image ? (
                        <img src={notification.cover_image} alt="封面" />
                      ) : (
                        <div className="cover-placeholder">📄</div>
                      )}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-subtitle">
                        {activeTab === 'rejected' ? (
                          <span className="reject-reason">驳回原因: {notification.reject_reason}</span>
                        ) : activeTab === 'approved' ? (
                          <span className="score">得分: {notification.score}</span>
                        ) : (
                          <span className="pending-info">等待您的审批</span>
                        )}
                      </div>
                      <div className="notification-meta">
                        提交者: {notification.student_name} | 提交时间: {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="notification-right">
                    {getStatusIcon(activeTab)}
                    <button 
                      className="clear-btn"
                      onClick={() => clearNotification(notification.id, activeTab)}
                      title="清除此通知"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherHomepage;