import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, FileText, Clock, Target, TrendingUp, Timer, 
  BookOpen, Zap, Calendar, Award, ArrowRight, Play
} from 'lucide-react';
import api from '../../services/api';

const BeautifulDashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 12,
    totalPages: 1847,
    totalHours: 42.5,
    currentStreak: 7,
    todayMinutes: 95,
    weeklyGoal: 300
  });
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning! ☀️";
    if (hour < 17) return "Good afternoon! 🌤️";
    return "Good evening! 🌙";
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Ready to tackle your study goals?",
      "Every page brings you closer to mastery!",
      "Time to turn knowledge into wisdom.",
      "Your learning journey continues here.",
      "Focus + consistency = extraordinary results."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

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
            <TrendingUp size={12} />
            +2 this week
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <BookOpen size={24} />
          </div>
          <div className="stat-value">{stats.totalPages.toLocaleString()}</div>
          <div className="stat-label">Pages Available</div>
          <div className="stat-change positive">
            <TrendingUp size={12} />
            +234 this week
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={24} />
          </div>
          <div className="stat-value">{stats.totalHours}h</div>
          <div className="stat-label">Total Study Time</div>
          <div className="stat-change positive">
            <TrendingUp size={12} />
            +5.2h this week
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <Zap size={24} />
          </div>
          <div className="stat-value">{stats.currentStreak}</div>
          <div className="stat-label">Day Streak</div>
          <div className="stat-change positive">
            <TrendingUp size={12} />
            Keep it up!
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

        <Link to="/goals" className="action-card">
          <div className="action-header">
            <div className="action-icon">
              <Target size={24} />
            </div>
            <div className="action-content">
              <h3>Set Study Goals</h3>
              <p>Define daily targets and track your progress toward academic milestones.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-600)', fontWeight: '600', fontSize: '14px' }}>
            Set goals <Award size={16} />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default BeautifulDashboard;
