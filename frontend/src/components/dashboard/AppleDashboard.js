import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Clock, Target, TrendingUp, Play, Upload, 
  Flame, Trophy, Star, ChevronRight, Activity
} from 'lucide-react';
import api from '../../services/api';

const AppleDashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalTopics: 0,
    totalPages: 0,
    recentFiles: [],
    topicStats: []
  });
  const [userProgress, setUserProgress] = useState({
    dailyGoal: 60,
    studyMinutes: 45,
    xpEarned: 120,
    streakDays: 3
  });
  const [currentUser] = useState('Victor'); // Replace with actual user
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    setGreeting(getTimeBasedGreeting());
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async () => {
    try {
      const [dashboardResponse, progressResponse] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/user-progress/stats').catch(() => ({ data: userProgress }))
      ]);

      setStats(dashboardResponse.data);
      setUserProgress(progressResponse.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    return Math.min((userProgress.studyMinutes / userProgress.dailyGoal) * 100, 100);
  };

  if (loading) {
    return (
      <div className="apple-dashboard loading">
        <div className="loading-skeleton">
          <div className="skeleton-header" />
          <div className="skeleton-stats" />
          <div className="skeleton-content" />
        </div>
      </div>
    );
  }

  return (
    <div className="apple-dashboard">
      {/* Welcome Header - Apple Style */}
      <div className="welcome-header">
        <h1 className="welcome-title">
          {greeting}, {currentUser} 👋
        </h1>
        <p className="welcome-subtitle">
          Here's everything you need to hit today's goal.
        </p>
      </div>

      {/* Top Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon">
            <BookOpen size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalFiles}</div>
            <div className="stat-label">PDFs Uploaded</div>
          </div>
          <Link to="/files" className="stat-action">
            Upload More
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {Math.floor(userProgress.studyMinutes / 60)}h {userProgress.studyMinutes % 60}m
            </div>
            <div className="stat-label">Total Study Time</div>
          </div>
          <div className="stat-streak">
            <Flame size={16} />
            <span>{userProgress.streakDays}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Target size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(getProgressPercentage())}%</div>
            <div className="stat-label">Daily Goal</div>
          </div>
          <div className="progress-ring">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="rgba(var(--primary-accent-hsl), 0.2)"
                strokeWidth="4"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="var(--primary-accent)"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - getProgressPercentage() / 100)}`}
                transform="rotate(-90 24 24)"
                className="progress-circle"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Continue Sprint Button */}
      <div className="continue-sprint-section">
        <button className="continue-sprint-btn">
          <Play size={20} />
          <span>Continue Sprint</span>
          <div className="btn-glow" />
        </button>
      </div>

      {/* Topic Progress Grid */}
      <div className="topic-progress-grid">
        <div className="section-header">
          <h2>Study Progress</h2>
          <Link to="/topics" className="section-action">
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="topic-cards">
          {stats.topicStats?.slice(0, 4).map(topic => (
            <div key={topic.id} className="topic-card">
              <div className="topic-header">
                <span className="topic-icon">{topic.icon}</span>
                <h3>{topic.name}</h3>
              </div>
              
              <div className="topic-progress">
                <div className="completion-ring">
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle
                      cx="36"
                      cy="36"
                      r="32"
                      fill="none"
                      stroke="rgba(var(--primary-accent-hsl), 0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="36"
                      cy="36"
                      r="32"
                      fill="none"
                      stroke="var(--primary-accent)"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - (topic.file_count || 0) / 10)}`}
                      transform="rotate(-90 36 36)"
                      className="progress-circle"
                    />
                  </svg>
                  <div className="progress-text">
                    {Math.round(((topic.file_count || 0) / 10) * 100)}%
                  </div>
                </div>
              </div>

              <div className="topic-stats">
                <span>{topic.file_count || 0} files</span>
                <span>{topic.total_pages || 0} pages</span>
              </div>

              <Link to={`/topics/${topic.id}`} className="topic-action">
                Start Sprint
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="activity-feed">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <Link to="/analytics" className="section-action">
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">
              <BookOpen size={16} />
            </div>
            <div className="activity-content">
              <span className="activity-text">Read 10 pages of Microecon</span>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <Trophy size={16} />
            </div>
            <div className="activity-content">
              <span className="activity-text">Completed Sprint: Ch. 1</span>
              <span className="activity-time">Yesterday</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon">
              <Target size={16} />
            </div>
            <div className="activity-content">
              <span className="activity-text">Hit daily goal (60 min)</span>
              <span className="activity-time">2 days ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/files" className="quick-action">
          <Upload size={20} />
          <span>Upload PDF</span>
        </Link>
        <Link to="/topics" className="quick-action">
          <Activity size={20} />
          <span>Create Topic</span>
        </Link>
        <Link to="/analytics" className="quick-action">
          <TrendingUp size={20} />
          <span>View Analytics</span>
        </Link>
      </div>
    </div>
  );
};

export default AppleDashboard;
