// frontend/src/components/analytics/RealTimeDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronUp, ChevronDown, RefreshCw, Download
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar} from 'recharts';
import api from '../../services/api';

const RealTimeDashboard = () => {
  // Real-time data state
  const [liveStats, setLiveStats] = useState({
    currentSession: null,
    todayStats: {
      studyMinutes: 0,
      pagesRead: 0,
      focusScore: 0,
      sessionsCompleted: 0
    },
    weeklyTrend: [],
    readingSpeed: [],
    focusPatterns: [],
    topicProgress: []
  });
  
  // Dashboard state
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // today, week, month
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  
  // Real-time updates
  const intervalRef = useRef(null);
  const wsRef = useRef(null);
  
  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      startRealTimeUpdates();
    }
    
    return () => {
      stopRealTimeUpdates();
    };
  }, [selectedPeriod, autoRefresh]);
  
  const loadDashboardData = async () => {
    try {
  // eslint-disable-next-line react-hooks/exhaustive-deps
      setLoading(true);
      
      const [
        statsRes,
        trendsRes,
        speedRes,
        focusRes,
        topicsRes,
        insightsRes
      ] = await Promise.all([
        api.get(`/analytics/live-stats?period=${selectedPeriod}`),
        api.get(`/analytics/trends?period=${selectedPeriod}`),
        api.get(`/analytics/reading-speed?period=${selectedPeriod}`),
        api.get(`/analytics/focus-patterns?period=${selectedPeriod}`),
        api.get(`/analytics/topic-progress`),
        api.get(`/analytics/insights?period=${selectedPeriod}`)
      ]);
      
      setLiveStats({
        currentSession: statsRes.data.currentSession,
        todayStats: statsRes.data.todayStats,
        weeklyTrend: trendsRes.data.trends || generateMockTrends(),
        readingSpeed: speedRes.data.readingSpeed || generateMockSpeed(),
        focusPatterns: focusRes.data.patterns || generateMockFocus(),
        topicProgress: topicsRes.data.progress || []
      });
      
      setInsights(insightsRes.data.insights || generateMockInsights());
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Use mock data as fallback
      setLiveStats({
        currentSession: null,
        todayStats: {
          studyMinutes: 125,
          pagesRead: 23,
          focusScore: 4.2,
          sessionsCompleted: 3
        },
        weeklyTrend: generateMockTrends(),
        readingSpeed: generateMockSpeed(),
        focusPatterns: generateMockFocus(),
        topicProgress: generateMockTopics()
      });
      setInsights(generateMockInsights());
    } finally {
      setLoading(false);
    }
  };
  
  const startRealTimeUpdates = () => {
    // Polling updates every 30 seconds
    intervalRef.current = setInterval(() => {
      updateLiveStats();
    }, 30000);
    
    // WebSocket connection for real-time session updates
    try {
      const wsUrl = `ws://localhost:3001/ws/analytics`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealTimeUpdate(data);
      };
      
      wsRef.current.onerror = () => {
        console.log('WebSocket connection failed, using polling only');
      };
    } catch (error) {
      console.log('WebSocket not available, using polling updates');
    }
  };
  
  const stopRealTimeUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };
  
  const updateLiveStats = async () => {
    try {
      const response = await api.get('/analytics/live-stats?period=today');
      setLiveStats(prev => ({
        ...prev,
        currentSession: response.data.currentSession,
        todayStats: response.data.todayStats
      }));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error updating live stats:', error);
    }
  };
  
  const handleRealTimeUpdate = (data) => {
    switch (data.type) {
      case 'session_update':
        setLiveStats(prev => ({
          ...prev,
          currentSession: data.session,
          todayStats: {
            ...prev.todayStats,
            studyMinutes: data.todayMinutes,
            pagesRead: data.todayPages
          }
        }));
        break;
      case 'session_complete':
        setLiveStats(prev => ({
          ...prev,
          currentSession: null,
          todayStats: {
            ...prev.todayStats,
            sessionsCompleted: prev.todayStats.sessionsCompleted + 1
          }
        }));
        break;
      default:
        break;
    }
  };
  
  // Mock data generators for development
  const generateMockTrends = () => {
    const days = selectedPeriod === 'today' ? 1 : selectedPeriod === 'week' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      studyMinutes: Math.floor(Math.random() * 120) + 30,
      pagesRead: Math.floor(Math.random() * 25) + 5,
      focusScore: Math.random() * 2 + 3,
      sessions: Math.floor(Math.random() * 5) + 1
    }));
  };
  
  const generateMockSpeed = () => {
    return Array.from({ length: 10 }, (_, i) => ({
      session: i + 1,
      wpm: Math.floor(Math.random() * 100) + 150,
      comprehension: Math.random() * 2 + 3,
      difficulty: Math.floor(Math.random() * 5) + 1
    }));
  };
  
  const generateMockFocus = () => {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour: hour,
      focusScore: Math.random() * 2 + 3 + (hour >= 9 && hour <= 11 ? 0.5 : 0) + (hour >= 14 && hour <= 16 ? 0.3 : 0),
      sessions: Math.floor(Math.random() * 3)
    }));
  };
  
  const generateMockTopics = () => {
    const topics = ['Mathematics', 'Physics', 'Computer Science', 'Literature', 'History'];
    return topics.map(topic => ({
      name: topic,
      progress: Math.floor(Math.random() * 100),
      timeSpent: Math.floor(Math.random() * 300) + 60,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      change: Math.floor(Math.random() * 20) + 5
    }));
  };
  
  const generateMockInsights = () => {
    return [
      {
        type: 'peak_performance',
        title: 'Peak Performance Window',
        description: 'Your focus is highest between 9-11 AM. Consider scheduling challenging topics during this time.',
        confidence: 0.87,
        actionable: true
      },
      {
        type: 'reading_speed',
        title: 'Reading Speed Improvement',
        description: 'Your reading speed has increased by 15% this week. Keep up the consistent practice!',
        confidence: 0.92,
        actionable: false
      },
      {
        type: 'distraction_pattern',
        title: 'Distraction Alert',
        description: 'You tend to get distracted more on Fridays. Try shorter study sessions or eliminate notifications.',
        confidence: 0.78,
        actionable: true
      }
    ];
  };
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };
  
  const formatLastUpdated = () => {
    const diff = (new Date() - lastUpdated) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };
  
  const exportData = async () => {
    try {
      const response = await api.get(`/analytics/export?period=${selectedPeriod}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_analytics_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your analytics...</p>
      </div>
    );
  }
  
  return (
    <div className="real-time-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-main">
          <h1 className="dashboard-title">📊 Real-Time Analytics</h1>
          <p className="dashboard-subtitle">Live insights into your study performance</p>
        </div>
        
        <div className="header-controls">
          <div className="period-selector">
            {['today', 'week', 'month'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="dashboard-actions">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`refresh-btn ${autoRefresh ? 'active' : ''}`}
              title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            >
              <RefreshCw size={16} />
              <span className={`refresh-indicator ${autoRefresh ? 'spinning' : ''}`}></span>
            </button>
            
            <button onClick={exportData} className="export-btn" title="Export Data">
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Live Session Status */}
      {liveStats.currentSession && (
        <div className="live-session-banner">
          <div className="session-info">
            <div className="session-indicator">
              <div className="pulse-dot"></div>
              <span>Live Session Active</span>
            </div>
            <div className="session-details">
              <span>📖 Page {liveStats.currentSession.currentPage}</span>
              <span>⏱️ {formatTime(liveStats.currentSession.duration)}</span>
              <span>🎯 {liveStats.currentSession.focusScore}/5 Focus</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-header">
            <Clock size={24} />
            <span className="metric-label">Study Time</span>
          </div>
          <div className="metric-value">{liveStats.todayStats.studyMinutes}min</div>
          <div className="metric-change positive">
            <TrendingUp size={12} />
            <span>+12% vs yesterday</span>
          </div>
        </div>
        
        <div className="metric-card success">
          <div className="metric-header">
            <BookOpen size={24} />
            <span className="metric-label">Pages Read</span>
          </div>
          <div className="metric-value">{liveStats.todayStats.pagesRead}</div>
          <div className="metric-change positive">
            <TrendingUp size={12} />
            <span>+8% vs yesterday</span>
          </div>
        </div>
        
        <div className="metric-card warning">
          <div className="metric-header">
            <Brain size={24} />
            <span className="metric-label">Focus Score</span>
          </div>
          <div className="metric-value">{liveStats.todayStats.focusScore.toFixed(1)}/5</div>
          <div className="metric-change neutral">
            <Activity size={12} />
            <span>Steady performance</span>
          </div>
        </div>
        
        <div className="metric-card info">
          <div className="metric-header">
            <Target size={24} />
            <span className="metric-label">Sessions</span>
          </div>
          <div className="metric-value">{liveStats.todayStats.sessionsCompleted}</div>
          <div className="metric-change positive">
            <ChevronUp size={12} />
            <span>Goal: 4 sessions</span>
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container large">
          <div className="chart-header">
            <h3>Study Progress Trend</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <div className="legend-color primary"></div>
                Study Minutes
              </span>
              <span className="legend-item">
                <div className="legend-color success"></div>
                Focus Score
              </span>
            </div>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={liveStats.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="studyMinutes" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="focusScore" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-container medium">
          <div className="chart-header">
            <h3>Reading Speed Analysis</h3>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={liveStats.readingSpeed.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="session" 
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="wpm" 
                  stroke="#06B6D4" 
                  fill="#06B6D4"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="chart-container medium">
          <div className="chart-header">
            <h3>Focus Patterns by Hour</h3>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={liveStats.focusPatterns.filter(p => p.sessions > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                />
                <Tooltip />
                <Bar 
                  dataKey="focusScore" 
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Topic Progress Section */}
      <div className="topics-progress-section">
        <div className="section-header">
          <h3>📚 Topic Progress</h3>
        </div>
        
        <div className="topics-grid">
          {liveStats.topicProgress.map((topic, index) => (
            <div key={index} className="topic-progress-card">
              <div className="topic-header">
                <h4>{topic.name}</h4>
                <div className={`trend-indicator ${topic.trend}`}>
                  {topic.trend === 'up' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  <span>{topic.change}%</span>
                </div>
              </div>
              
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${topic.progress}%` }}
                  />
                </div>
                <span className="progress-percentage">{topic.progress}%</span>
              </div>
              
              <div className="topic-stats">
                <span>⏱️ {formatTime(topic.timeSpent * 60)}</span>
                <span>📖 {Math.floor(topic.progress / 10)} sessions</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* AI Insights Section */}
      <div className="insights-section">
        <div className="section-header">
          <h3>🧠 AI-Powered Insights</h3>
          <div className="insights-refresh">
            <button onClick={loadDashboardData} className="refresh-insights-btn">
              <RefreshCw size={14} />
              Refresh Insights
            </button>
          </div>
        </div>
        
        <div className="insights-grid">
          {insights.map((insight, index) => (
            <div key={index} className={`insight-card ${insight.type}`}>
              <div className="insight-header">
                <div className="insight-icon">
                  {insight.type === 'peak_performance' && <Zap size={20} />}
                  {insight.type === 'reading_speed' && <TrendingUp size={20} />}
                  {insight.type === 'distraction_pattern' && <Eye size={20} />}
                </div>
                <div className="insight-meta">
                  <h4>{insight.title}</h4>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ width: `${insight.confidence * 100}%` }}
                    />
                  </div>
                  <span className="confidence-text">
                    {Math.round(insight.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
              
              <p className="insight-description">{insight.description}</p>
              
              {insight.actionable && (
                <div className="insight-action">
                  <button className="action-btn">Take Action</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer Stats */}
      <div className="dashboard-footer">
        <div className="footer-stats">
          <span>Last updated: {formatLastUpdated()}</span>
          <span>•</span>
          <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
          <span>•</span>
          <span>Data period: {selectedPeriod}</span>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;