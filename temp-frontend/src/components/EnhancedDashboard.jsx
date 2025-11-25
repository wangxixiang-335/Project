import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EnhancedDashboard.css';

const API_BASE = '/api';

const EnhancedDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('bar');

  // 加载统计数据
  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/stats/student`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 加载趋势数据
  const loadTrends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/project-management/stats/student/trends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const trendsData = response.data.data || [];
        const validTrends = trendsData.filter(t => t && t.project_id).map(t => ({
          ...t,
          score: null
        }));
        setTrends(validTrends);
      }
    } catch (error) {
      console.error('获取趋势数据失败:', error);
      setTrends([]);
    }
  };

  // AI分析功能
  const generateAIAnalysis = (stats, trends) => {
    if (!stats) return '';

    let analysis = '';
    
    const { total_projects, approved_count, rejected_count, pending_count } = stats;
    const approvalRate = total_projects > 0 ? (approved_count / total_projects * 100).toFixed(1) : 0;
    const rejectionRate = total_projects > 0 ? (rejected_count / total_projects * 100).toFixed(1) : 0;

    analysis += `📊 数据概览分析

`;
    analysis += `您共发布了 ${total_projects} 个成果,其中:
`;
    analysis += `- 通过审批: ${approved_count} 个 (${approvalRate}%)
`;
    analysis += `- 被驳回: ${rejected_count} 个 (${rejectionRate}%)
`;
    analysis += `- 待审核: ${pending_count} 个
`;
    analysis += `- 总浏览量: 暂无数据

`;

    // 优势分析
    analysis += `🎯 个人优势分析

`;
    
    if (approvalRate >= 80) {
      analysis += `✅ 优秀表现!您的成果通过率高达 ${approvalRate}%,说明您的项目质量非常出色.建议继续保持这种标准,可以考虑挑战更复杂的项目.

`;
    } else if (approvalRate >= 60) {
      analysis += `✅ 良好表现!您的成果通过率为 ${approvalRate}%,整体表现不错.建议关注教师的反馈意见,在某些方面还有提升空间.

`;
    } else if (approvalRate >= 40) {
      analysis += `⚠️ 需要改进!您的成果通过率为 ${approvalRate}%,建议您:
`;
      analysis += `- 仔细阅读项目要求和评分标准
`;
      analysis += `- 参考已通过的优秀项目案例
`;
      analysis += `- 在提交前进行充分的自查和改进

`;
    } else {
      analysis += `❌ 需要重点关注!您的成果通过率较低 (${approvalRate}%),建议您:
`;
      analysis += `- 与指导教师沟通,了解具体要求
`;
      analysis += `- 分析被驳回的原因,避免重复错误
`;
      analysis += `- 寻求同学或老师的帮助和指导

`;
    }

    // 趋势分析
    analysis += `📈 发展趋势分析

`;
    
    if (trends.length >= 3) {
      const recentScores = trends.slice(-3);
      const improving = recentScores.every((trend, index) => 
        index === 0 || trend.score >= recentScores[index - 1].score
      );

      if (improving) {
        analysis += `🚀 进步明显!您的成果质量在不断提升,这说明您的学习能力很强.继续保持这种进步势头!

`;
      } else {
        analysis += `⚠️ 需要调整!最近成果得分有所下降,建议您回顾近期的项目,找出问题所在并及时调整.

`;
      }
    } else if (trends.length >= 1) {
      analysis += `📊 保持稳定!您的成果质量保持稳定,这是很好的基础.可以尝试在某些方面寻求突破.

`;
    } else {
      analysis += `📊 评分数据有限!目前只有1个成果有评分,建议您继续发布更多成果以获得更全面的分析.

`;
    }

    // 建议
    analysis += `💡 改进建议

`;
    
    if (pending_count > 0) {
      analysis += `- 您有 ${pending_count} 个成果正在审核中,请耐心等待教师反馈

`;
    }

    if (rejected_count > 0) {
      analysis += `- 您有被驳回的成果,建议仔细分析驳回原因,在下次提交时避免类似问题

`;
    }

    if (total_projects < 3) {
      analysis += `- 您发布的成果数量较少,建议多参与项目实践,积累经验

`;
    }

    analysis += `- 定期查看数据看板,了解自己的进步情况
`;
    analysis += `- 积极参与同学间的交流和讨论,互相学习提高
`;
    analysis += `- 主动寻求教师指导,及时反馈问题

`;

    return analysis;
  };

  useEffect(() => {
    if (user) {
      loadStats();
      loadTrends();
    }
  }, [user]);

  useEffect(() => {
    if (stats && trends.length > 0) {
      const analysis = generateAIAnalysis(stats, trends);
      setAiAnalysis(analysis);
      setLoading(false);
    }
  }, [stats, trends]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">正在加载分析数据...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-container">
        <div className="no-data">暂无数据，请先提交项目</div>
      </div>
    );
  }

  const { total_projects, approved_count, rejected_count, pending_count, draft_count } = stats;

  return (
    <div className="dashboard-container">
      <div className="content-section">
        <h2>📊 学习数据看板</h2>
        
        {/* 统计卡片 */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-number">{total_projects || 0}</div>
            <div className="stat-label">总项目数</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-number">{pending_count || 0}</div>
            <div className="stat-label">待审批</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-number">{approved_count || 0}</div>
            <div className="stat-label">已通过</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-number">{rejected_count || 0}</div>
            <div className="stat-label">被驳回</div>
          </div>
        </div>

        {/* 统计图表 */}
        <div className="stats-chart">
          <h3>📊 项目状态分布</h3>
          
          <div className="chart-bar">
            <div className="chart-label">
              <span>待审批</span>
              <span>{pending_count || 0}</span>
            </div>
            <div className="chart-bar-bg">
              <div 
                className="chart-bar-fill"
                style={{ width: `${((pending_count || 0) / (total_projects || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="chart-bar">
            <div className="chart-label">
              <span>已通过</span>
              <span>{approved_count || 0}</span>
            </div>
            <div className="chart-bar-bg">
              <div 
                className="chart-bar-fill"
                style={{ width: `${((approved_count || 0) / (total_projects || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="chart-bar">
            <div className="chart-label">
              <span>被驳回</span>
              <span>{rejected_count || 0}</span>
            </div>
            <div className="chart-bar-bg">
              <div 
                className="chart-bar-fill"
                style={{ width: `${((rejected_count || 0) / (total_projects || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* AI分析 */}
        <div className="ai-analysis">
          <h3>🤖 AI智能分析</h3>
          <div className="analysis-content">
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {aiAnalysis}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;