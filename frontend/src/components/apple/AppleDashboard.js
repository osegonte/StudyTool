import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, FileText, Clock, Target, TrendingUp, Timer} from 'lucide-react';
import api from '../../services/api';

const AppleDashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalPages: 0,
    totalHours: 0,
    currentStreak: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [dashboardRes, progressRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: { totalFiles: 0, totalPages: 0 } })),
        api.get('/user-progress/stats').catch(() => ({ data: { current_streak: 0 } }))
      ]);

      setStats({
        totalFiles: dashboardRes.data.totalFiles || 0,
        totalPages: dashboardRes.data.totalPages || 0,
        totalHours: dashboardRes.data.totalHours || 0,
        currentStreak: progressRes.data.current_streak || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning! ☀️";
    if (hour < 17) return "Good afternoon! 🌤️";
    return "Good evening! 🌙";
  };

  const getMotivationalMessage = () => {
    if (stats.totalFiles === 0) {
      return "Ready to start your learning journey?";
    }
    if (stats.currentStreak === 0) {
      return "Time to begin a new study streak!";
    }
    if (stats.currentStreak >= 7) {
      return "Amazing streak! Keep up the excellent work!";
    }
    return "Every study session brings you closer to your goals!";
  };

  if (loading) {
    return (
      <div className="dashboard fade-in-up">
        <div className="dashboard-header">
          <div className="dashboard-greeting">
            <h1 className="greeting-text">Loading...</h1>
            <p className="greeting-subtitle">Preparing your study dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in-up">
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h1 className="greeting-text">{getGreeting()}</h1>
          <p className="greeting-subtitle">{getMotivationalMessage()}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <FileText size={24} />
          </div>
          <div className="stat-value">{stats.totalFiles}</div>
          <div className="stat-label">Documents</div>
          <div className="stat-change positive">
            {stats.totalFiles > 0 ? (
              <>
                <TrendingUp size={12} />
                Ready to study
              </>
            ) : (
              'Upload your first PDF'
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <BookOpen size={24} />
          </div>
          <div className="stat-value">{stats.totalPages.toLocaleString()}</div>
          <div className="stat-label">Pages Available</div>
          <div className="stat-change positive">
            {stats.totalPages > 0 ? (
              <>
                <TrendingUp size={12} />
                Start reading
              </>
            ) : (
              'No content yet'
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={24} />
          </div>
          <div className="stat-value">{stats.totalHours}h</div>
          <div className="stat-label">Total Study Time</div>
          <div className="stat-change positive">
            {stats.totalHours > 0 ? (
              <>
                <TrendingUp size={12} />
                Keep going!
              </>
            ) : (
              'Start your first session'
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <Zap size={24} />
          </div>
          <div className="stat-value">{stats.currentStreak}</div>
          <div className="stat-label">Day Streak</div>
          <div className="stat-change positive">
            {stats.currentStreak > 0 ? (
              <>
                <TrendingUp size={12} />
                Keep it up!
              </>
            ) : (
              'Start your streak!'
            )}
          </div>
        </div>
      </div>

      <div className="action-grid">
        <Link to="/files" className="action-card">
          <div className="action-header">
            <div className="action-icon">
              <Upload size={24} />
            </div>
            <div className="action-content">
              <h3>Upload New PDF</h3>
              <p>Add study materials and organize them by topic for focused learning sessions.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-600)', fontWeight: '600', fontSize: '14px' }}>
            Start uploading <ArrowRight size={16} />
          </div>
        </Link>

        <Link to="/topics" className="action-card">
          <div className="action-header">
            <div className="action-icon">
              <Target size={24} />
            </div>
            <div className="action-content">
              <h3>Create Topics</h3>
              <p>Organize your study materials by subject and track your progress effectively.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-600)', fontWeight: '600', fontSize: '14px' }}>
            Create topic <ArrowRight size={16} />
          </div>
        </Link>

        <Link to="/sprints" className="action-card">
          <div className="action-header">
            <div className="action-icon">
              <Timer size={24} />
            </div>
            <div className="action-content">
              <h3>Start Study Sprint</h3>
              <p>Begin a focused 25-minute study session with automatic progress tracking.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-600)', fontWeight: '600', fontSize: '14px' }}>
            Start sprint <Play size={16} />
          </div>
        </Link>

        <Link to="/analytics" className="action-card">
          <div className="action-header">
            <div className="action-icon">
              <BarChart3 size={24} />
            </div>
            <div className="action-content">
              <h3>View Analytics</h3>
              <p>Track your reading speed, focus patterns, and study consistency over time.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-600)', fontWeight: '600', fontSize: '14px' }}>
            View insights <TrendingUp size={16} />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AppleDashboard;
