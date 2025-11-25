import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeacherDashboard.css';

const API_BASE = '/api';

const TeacherDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    publishStats: [],
    scoreDistribution: [],
    classStats: [],
    recentActivities: []
  });
  const [selectedClass, setSelectedClass] = useState('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 获取看板数据
  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 获取发布量统计
      const publishResponse = await axios.get(`${API_BASE}/teacher/dashboard/publish-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 获取分数分布
      const scoreResponse = await axios.get(`${API_BASE}/teacher/dashboard/score-distribution`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { class_name: selectedClass }
      });
      
      // 获取班级统计
      const classResponse = await axios.get(`${API_BASE}/teacher/dashboard/class-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 获取最近活动
      const activityResponse = await axios.get(`${API_BASE}/teacher/dashboard/recent-activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDashboardData({
        publishStats: publishResponse.data.data || [],
        scoreDistribution: scoreResponse.data.data || [],
        classStats: classResponse.data.data || [],
        recentActivities: activityResponse.data.data || []
      });
    } catch (error) {
      console.error('获取看板数据失败:', error);
      setMessage('获取看板数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染发布量统计图表
  const renderPublishChart = () => {
    if (!dashboardData.publishStats.length) return null;

    const counts = dashboardData.publishStats.map(item => item.count || 0);
    const maxValue = counts.length > 0 ? Math.max(...counts) : 1;
    
    return (
      <div className="chart-container">
        <h4>月度发布量统计</h4>
        <div className="bar-chart">
          {dashboardData.publishStats.map((item, index) => (
            <div key={index} className="chart-bar">
              <div className="bar-label">{item.month}</div>
              <div className="bar-container">
                <div 
                  className="bar-fill"
                  style={{ 
                    height: `${(item.count / maxValue) * 100}%`,
                    background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
                  }}
                >
                  <span className="bar-value">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染分数分布图表
  const renderScoreChart = () => {
    if (!dashboardData.scoreDistribution.length) return null;

    const total = dashboardData.scoreDistribution.reduce((sum, item) => sum + (item.count || 0), 0);
    
    return (
      <div className="chart-container">
        <h4>分数分布图</h4>
        <div className="pie-chart">
          {dashboardData.scoreDistribution.map((item, index) => {
            const percentage = total > 0 ? ((item.count || 0) / total) * 100 : 0;
            const colors = ['#28a745', '#17a2b8', '#ffc107', '#fd7e14', '#dc3545'];
            
            return (
              <div key={index} className="pie-segment" style={{
                background: colors[index % colors.length],
                transform: `rotate(${index * 72}deg)`,
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((index + 1) * 72 * Math.PI / 180)}% ${50 - 50 * Math.sin((index + 1) * 72 * Math.PI / 180)}%)`
              }}>
                <span className="segment-label">{item.range}</span>
                <span className="segment-value">{(percentage || 0).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
        <div className="pie-legend">
          {dashboardData.scoreDistribution.map((item, index) => {
            const colors = ['#28a745', '#17a2b8', '#ffc107', '#fd7e14', '#dc3545'];
            return (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ background: colors[index % colors.length] }}></div>
                <span>{item.range}: {item.count}个</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 渲染班级成绩分布
  const renderClassChart = () => {
    if (!dashboardData.classStats.length) return null;

    return (
      <div className="chart-container">
        <div className="class-chart-header">
          <h4>班级成绩分布图</h4>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="class-selector"
          >
            <option value="all">全部班级</option>
            {Array.from(new Set(dashboardData.classStats.map(item => item.class_name))).map(className => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        </div>
        <div className="line-chart">
          <div className="chart-axis">
            <div className="y-axis">
              <span>100</span>
              <span>80</span>
              <span>60</span>
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>
            <div className="chart-area">
              {dashboardData.classStats
                .filter(item => selectedClass === 'all' || item.class_name === selectedClass)
                .map((item, index) => (
                <div key={index} className="line-point" style={{
                  left: dashboardData.classStats.length > 1 ? `${(index / Math.max(dashboardData.classStats.length - 1, 1)) * 100}%` : '0%',
                  bottom: `${(item.average_score || 0)}%`
                }}>
                  <div className="point-dot" title={`${item.class_name}: ${item.average_score ? item.average_score.toFixed(1) : '暂无数据'}分`}></div>
                  <div className="point-label">{item.class_name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染最近活动
  const renderRecentActivities = () => {
    if (!dashboardData.recentActivities.length) return null;

    return (
      <div className="activities-section">
        <h4>最近活动</h4>
        <div className="activities-list">
          {dashboardData.recentActivities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className={`activity-icon ${activity.type}`}>
                {activity.type === 'submit' && '📤'}
                {activity.type === 'approve' && '✅'}
                {activity.type === 'reject' && '❌'}
                {activity.type === 'comment' && '💬'}
              </div>
              <div className="activity-content">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-time">{new Date(activity.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染统计卡片
  const renderStatCards = () => {
    const totalProjects = dashboardData.publishStats.reduce((sum, item) => sum + (item.count || 0), 0);
    const totalCounts = dashboardData.scoreDistribution.reduce((sum, item) => sum + (item.count || 0), 0);
    const avgScore = dashboardData.scoreDistribution.length > 0 && totalCounts > 0
      ? (dashboardData.scoreDistribution.reduce((sum, item) => {
          const midPoint = item.range.includes('90') ? 95 :
                          item.range.includes('80') ? 85 :
                          item.range.includes('70') ? 75 :
                          item.range.includes('60') ? 65 : 55;
          return sum + (midPoint * (item.count || 0));
        }, 0) / totalCounts)
      : 0;

    return (
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{totalProjects}</div>
            <div className="stat-label">总发布量</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-number">{(avgScore || 0).toFixed(1)}</div>
            <div className="stat-label">平均分数</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData.classStats.length}</div>
            <div className="stat-label">参与班级</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData.recentActivities.length}</div>
            <div className="stat-label">今日活动</div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedClass]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="teacher-dashboard">
      {message && (
        <div className={`message ${message.includes('失败') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="dashboard-header">
        <h2>数据看板</h2>
        <div className="dashboard-info">
          <span>欢迎回来，{user.username}</span>
          <span className="update-time">最后更新：{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 统计卡片 */}
      {renderStatCards()}

      {/* 图表区域 */}
      <div className="charts-grid">
        <div className="chart-card">
          {renderPublishChart()}
        </div>
        <div className="chart-card">
          {renderScoreChart()}
        </div>
      </div>

      {/* 班级成绩分布和最近活动 */}
      <div className="bottom-section">
        <div className="chart-card large">
          {renderClassChart()}
        </div>
        <div className="activities-card">
          {renderRecentActivities()}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;