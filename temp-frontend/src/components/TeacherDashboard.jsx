import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeacherDashboard.css';

const API_BASE = '/api';

const TeacherDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    publishStats: [],
    scoreTrend: [], // 成绩折线图数据
    aiAnalysis: ''  // AI分析结果
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 获取看板数据
  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('teacherToken') || localStorage.getItem('token') || 'dev-teacher-token';
      
      // 获取发布量统计
      const publishResponse = await axios.get(`${API_BASE}/teacher/dashboard/publish-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 获取学生的成果数据，用于成绩折线图
      const scoreResponse = await axios.get(`${API_BASE}/teacher/student-achievements`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 50 }
      });

      // 处理发布量数据 - 按类型统计
      const publishData = publishResponse.data.data || [];
      const publishByType = processPublishStats(publishData);
      
      // 处理成绩趋势数据
      const scoreData = scoreResponse.data.data?.items || scoreResponse.data.data || [];
      const scoreTrend = processScoreTrend(scoreData);
      
      // 生成AI分析
      const aiAnalysis = generateAIAnalysis(publishByType, scoreTrend);

      setDashboardData({
        publishStats: publishByType,
        scoreTrend: scoreTrend,
        aiAnalysis: aiAnalysis
      });
    } catch (error) {
      console.error('获取看板数据失败:', error);
      setMessage('获取看板数据失败');
      // 使用模拟数据作为后备
      setDashboardData({
        publishStats: [
          { type: '论文', count: 5 },
          { type: '项目', count: 8 },
          { type: '设计', count: 3 }
        ],
        scoreTrend: [
          { date: '2024-01', score: 85 },
          { date: '2024-02', score: 88 },
          { date: '2024-03', score: 82 },
          { date: '2024-04', score: 90 }
        ],
        aiAnalysis: '根据您的数据分析，您在项目管理方面表现突出，平均分数达到88分。建议继续保持项目指导的优势，同时可以加强论文撰写的系统性指导。'
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理发布量统计 - 按类型分组
  const processPublishStats = (data) => {
    const typeCount = {};
    data.forEach(item => {
      const type = item.project_type || '未分类';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    return Object.entries(typeCount).map(([type, count]) => ({
      type,
      count
    }));
  };

  // 处理成绩趋势数据
  const processScoreTrend = (data) => {
    const scoredItems = data
      .filter(item => item.score && item.status === 2) // 只包括已评分且通过的项目
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(-10); // 最近10个成绩

    return scoredItems.map(item => ({
      date: new Date(item.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' }),
      score: item.score,
      title: item.title
    }));
  };

  // 生成AI分析
  const generateAIAnalysis = (publishStats, scoreTrend) => {
    if (publishStats.length === 0 && scoreTrend.length === 0) {
      return '数据不足，暂无法进行分析。请等待更多学生提交成果后再来查看。';
    }

    let analysis = '📊 数据分析报告：\n\n';
    
    // 分析发布类型优势
    if (publishStats.length > 0) {
      const maxType = publishStats.reduce((max, item) => item.count > max.count ? item : max);
      const totalCount = publishStats.reduce((sum, item) => sum + item.count, 0);
      const percentage = ((maxType.count / totalCount) * 100).toFixed(1);
      
      analysis += `🎯 **个人优势分析：**\n`;
      analysis += `您在"${maxType.type}"类型指导方面表现最为突出，占指导总量的${percentage}%。\n\n`;
      
      // 给出建议
      if (maxType.type === '项目') {
        analysis += `💡 **发展建议：** 您的项目指导能力很强，建议继续加强实践环节的设计，同时可以考虑将项目经验转化为论文或案例分析，提升学生理论水平。\n\n`;
      } else if (maxType.type === '论文') {
        analysis += `💡 **发展建议：** 您在学术指导方面经验丰富，建议鼓励学生将论文内容转化为实际项目，增强实践应用能力。\n\n`;
      } else if (maxType.type === '设计') {
        analysis += `💡 **发展建议：** 您在设计指导方面独具慧眼，建议结合行业趋势，将设计理念与商业价值结合，提升作品的市场竞争力。\n\n`;
      }
    }

    // 分析成绩趋势
    if (scoreTrend.length > 0) {
      const avgScore = (scoreTrend.reduce((sum, item) => sum + item.score, 0) / scoreTrend.length).toFixed(1);
      const recentScores = scoreTrend.slice(-3);
      const recentAvg = (recentScores.reduce((sum, item) => sum + item.score, 0) / recentScores.length).toFixed(1);
      
      analysis += `📈 **成绩趋势分析：**\n`;
      analysis += `您指导的学生平均成绩为${avgScore}分，近期平均成绩为${recentAvg}分。\n`;
      
      if (recentAvg > avgScore) {
        analysis += `🌟 **良好趋势：** 近期成绩呈上升趋势，说明您的指导方法在持续优化中。\n\n`;
      } else if (recentAvg < avgScore) {
        analysis += `⚠️ **需要关注：** 近期成绩有所下降，建议加强学生沟通，了解学习难点并提供针对性指导。\n\n`;
      } else {
        analysis += `📊 **稳定表现：** 成绩保持稳定，说明您的指导方法成熟有效。\n\n`;
      }
    }

    // 总结建议
    analysis += `🎯 **综合发展建议：**\n`;
    analysis += `继续保持您的指导优势，定期与学生进行深度交流，关注他们的学习进度和困难。建议每学期组织1-2次经验分享会，促进同学间的相互学习。`;
    
    return analysis;
  };

  // 渲染发布量统计图表
  const renderPublishChart = () => {
    if (!dashboardData.publishStats.length) return null;

    const counts = dashboardData.publishStats.map(item => item.count || 0);
    const maxValue = counts.length > 0 ? Math.max(...counts) : 1;
    
    return (
      <div className="chart-container">
        <h3>📊 发布量类型统计</h3>
        <div className="bar-chart">
          {dashboardData.publishStats.map((item, index) => (
            <div key={index} className="chart-bar">
              <div className="bar-label">{item.type}</div>
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

  // 渲染成绩折线图
  const renderScoreLineChart = () => {
    if (!dashboardData.scoreTrend.length) return null;

    const scores = dashboardData.scoreTrend.map(item => item.score || 0);
    const maxScore = Math.max(...scores, 100);
    const minScore = Math.min(...scores, 0);
    const range = maxScore - minScore || 1;

    return (
      <div className="chart-container">
        <h3>📈 成绩趋势图</h3>
        <div className="line-chart">
          <div className="chart-grid">
            <div className="grid-line" style={{ bottom: '0%' }}><span>60</span></div>
            <div className="grid-line" style={{ bottom: '25%' }}><span>70</span></div>
            <div className="grid-line" style={{ bottom: '50%' }}><span>80</span></div>
            <div className="grid-line" style={{ bottom: '75%' }}><span>90</span></div>
            <div className="grid-line" style={{ bottom: '100%' }}><span>100</span></div>
          </div>
          
          <svg className="line-svg" viewBox="0 0 800 400" preserveAspectRatio="none">
            {/* 绘制网格线 */}
            {[0, 25, 50, 75, 100].map(percent => (
              <line
                key={percent}
                x1="0"
                y1={`${100 - percent}%`}
                x2="100%"
                y2={`${100 - percent}%`}
                stroke="#e0e0e0"
                strokeWidth="1"
              />
            ))}
            
            {/* 绘制折线 */}
            <polyline
              points={dashboardData.scoreTrend.map((item, index) => {
                const x = (index / (dashboardData.scoreTrend.length - 1 || 1)) * 100;
                const y = 100 - ((item.score - minScore) / range) * 100;
                return `${x}%,${y}%`;
              }).join(' ')}
              fill="none"
              stroke="#667eea"
              strokeWidth="3"
            />
            
            {/* 绘制数据点 */}
            {dashboardData.scoreTrend.map((item, index) => {
              const x = (index / (dashboardData.scoreTrend.length - 1 || 1)) * 100;
              const y = 100 - ((item.score - minScore) / range) * 100;
              return (
                <circle
                  key={index}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="5"
                  fill="#667eea"
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          
          {/* X轴标签 */}
          <div className="x-axis-labels">
            {dashboardData.scoreTrend.map((item, index) => (
              <div 
                key={index} 
                className="x-label"
                style={{ 
                  left: dashboardData.scoreTrend.length > 1 
                    ? `${(index / (dashboardData.scoreTrend.length - 1)) * 100}%` 
                    : '50%'
                }}
              >
                <div className="label-date">{item.date}</div>
                <div className="label-score">{item.score}分</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 渲染AI分析
  const renderAIAnalysis = () => {
    if (!dashboardData.aiAnalysis) return null;

    return (
      <div className="ai-analysis-container">
        <h3>🤖 AI智能分析</h3>
        <div className="ai-analysis-content">
          {dashboardData.aiAnalysis.split('\n').map((paragraph, index) => {
            if (paragraph.trim() === '') return null;
            
            // 处理markdown格式
            let content = paragraph;
            let isImportant = false;
            
            if (paragraph.includes('**')) {
              content = paragraph.replace(/\*\*/g, '');
              isImportant = true;
            }
            
            return (
              <p key={index} className={isImportant ? 'ai-important' : 'ai-text'}>
                {content}
              </p>
            );
          })}
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="teacher-dashboard">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>正在加载数据看板...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      {message && (
        <div className={`message ${message.includes('失败') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* 标题区域 */}
      <div className="dashboard-header">
        <h2>📊 数据看板</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          基于您的教学数据智能分析，帮助您了解教学优势和改进方向
        </p>
      </div>

      {/* 图表区域 */}
      <div className="dashboard-charts">
        {/* 发布量统计图 */}
        {renderPublishChart()}
        
        {/* 成绩折线图 */}
        {renderScoreLineChart()}
      </div>

      {/* AI分析区域 */}
      {renderAIAnalysis()}
    </div>
  );
};

export default TeacherDashboard;