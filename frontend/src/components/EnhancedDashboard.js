import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Target, Flame, BookOpen, Clock, TrendingUp, 
  Star, Award, Brain, Coffee, Zap 
} from 'lucide-react';
import api from '../services/api';
import AchievementDisplay from './AchievementDisplay';
import DailyRecommendations from './DailyRecommendations';

const EnhancedDashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalTopics: 0,
    totalPages: 0,
    recentFiles: []
  });
  const [userProgress, setUserProgress] = useState({
    total_xp: 0,
    current_level: 1,
    current_streak: 0,
    today_progress: { study_minutes: 0, pages_read: 0, xp_earned: 0 }
  });
  const [stage4Stats, setStage4Stats] = useState({
    achievements: { unlocked_achievements: 0, total_achievements: 0 },
    daily_recommendations: { completed_recommendations: 0, total_recommendations: 0 }
  });
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
    checkMilestones();
  }, []);

  const loadAllData = async () => {
    try {
      const [dashboardResponse, progressResponse, stage4Response] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/user-progress/stats'),
        api.get('/dashboard/stage4-stats').catch(() => ({ data: {} }))
      ]);

      setStats(dashboardResponse.data);
      setUserProgress(progressResponse.data);
      setStage4Stats(stage4Response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMilestones = async () => {
    try {
      const progressData = {
        total_pages: userProgress.today_progress?.pages_read || 0,
        total_hours: Math.floor((userProgress.today_progress?.study_minutes || 0) / 60),
        current_streak: userProgress.current_streak || 0,
        goals_completed: 0 // Would need to calculate from goals
      };

      const milestoneResponse = await api.post('/milestones/check', {
        progress_data: progressData
      });

      if (milestoneResponse.data.triggered_milestones.length > 0) {
        setMilestones(milestoneResponse.data.triggered_milestones);
        // Show milestone celebrations
        milestoneResponse.data.triggered_milestones.forEach(milestone => {
          showMilestoneNotification(milestone);
        });
      }
    } catch (error) {
      console.error('Error checking milestones:', error);
    }
  };

  const showMilestoneNotification = (milestone) => {
    if (Notification.permission === 'granted') {
      new Notification(`🎉 Milestone Reached!`, {
        body: milestone.celebration_message,
        icon: '/favicon.ico'
      });
    }
  };

  const calculateLevelProgress = () => {
    const currentLevelXP = Math.pow(userProgress.current_level, 2) * 100;
    const nextLevelXP = Math.pow(userProgress.current_level + 1, 2) * 100;
    const progressInLevel = userProgress.total_xp - currentLevelXP;
    const totalNeededForNext = nextLevelXP - currentLevelXP;
    return Math.max(0, Math.min(100, (progressInLevel / totalNeededForNext) * 100));
  };

  const getDailyGoalProgress = () => {
    const goal = userProgress.daily_goal || 60;
    const progress = userProgress.today_progress?.study_minutes || 0;
    return Math.min(100, (progress / goal) * 100);
  };

  if (loading) {
    return (
      <div className="enhanced-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading your study dashboard...</p>
      </div>
    );
  }

  return (
    <div className="enhanced-dashboard">
      {/* Milestone Celebrations */}
      {milestones.length > 0 && (
        <div className="milestone-celebrations">
          {milestones.map((milestone, index) => (
            <div key={index} className="milestone-celebration">
              <div className="celebration-content">
                <div className="celebration-icon">{milestone.icon}</div>
                <h3>{milestone.title}</h3>
                <p>{milestone.celebration_message}</p>
                <div className="xp-bonus">+{milestone.xp_bonus} XP Bonus!</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header with Level and XP */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Study Dashboard</h1>
          <p>Welcome back! Here's your learning progress.</p>
        </div>
        
        <div className="level-display">
          <div className="level-info">
            <div className="level-badge">
              <Star className="level-icon" />
              <span className="level-number">Level {userProgress.current_level}</span>
            </div>
            <div className="xp-info">
              <span className="total-xp">{userProgress.total_xp} XP</span>
              <div className="level-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${calculateLevelProgress()}%` }}
                  />
                </div>
                <span className="progress-text">
                  {Math.round(calculateLevelProgress())}% to Level {userProgress.current_level + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card streak-card">
          <div className="metric-icon">
            <Flame className="streak-icon" />
          </div>
          <div className="metric-info">
            <h3>{userProgress.current_streak}</h3>
            <p>Day Streak</p>
            <div className="metric-trend">
              {userProgress.current_streak > 0 ? '🔥 On fire!' : 'Start your streak!'}
            </div>
          </div>
        </div>

        <div className="metric-card goal-card">
          <div className="metric-icon">
            <Target className="goal-icon" />
          </div>
          <div className="metric-info">
            <h3>{Math.round(getDailyGoalProgress())}%</h3>
            <p>Daily Goal</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getDailyGoalProgress()}%` }}
              />
            </div>
          </div>
        </div>

        <div className="metric-card achievement-card">
          <div className="metric-icon">
            <Trophy className="achievement-icon" />
          </div>
          <div className="metric-info">
            <h3>
              {stage4Stats.achievements?.unlocked_achievements || 0}/
              {stage4Stats.achievements?.total_achievements || 0}
            </h3>
            <p>Achievements</p>
            <div className="metric-trend">
              {stage4Stats.achievements?.unlocked_achievements > 0 ? '🏆 Earning badges!' : 'Start achieving!'}
            </div>
          </div>
        </div>

        <div className="metric-card today-card">
          <div className="metric-icon">
            <BookOpen className="today-icon" />
          </div>
          <div className="metric-info">
            <h3>{userProgress.today_progress?.study_minutes || 0}m</h3>
            <p>Today's Study</p>
            <div className="today-details">
              <span>{userProgress.today_progress?.pages_read || 0} pages</span>
              <span>{userProgress.today_progress?.xp_earned || 0} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Daily Recommendations */}
        <div className="content-section recommendations-section">
          <DailyRecommendations />
        </div>

        {/* Recent Files */}
        <div className="content-section files-section">
          <h3>📚 Continue Reading</h3>
          {stats.recentFiles && stats.recentFiles.length > 0 ? (
            <div className="recent-files-list">
              {stats.recentFiles.slice(0, 3).map(file => (
                <Link 
                  key={file.id} 
                  to={`/viewer/${file.id}`} 
                  className="recent-file-item"
                >
                  <div className="file-info">
                    <h4>{file.original_name}</h4>
                    <p>{file.page_count} pages</p>
                  </div>
                  <div className="file-action">
                    <Clock size={16} />
                    <span>Continue</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-files">
              <BookOpen size={48} />
              <p>Upload your first PDF to start studying!</p>
              <Link to="/files" className="btn btn-primary">
                Upload PDF
              </Link>
            </div>
          )}
        </div>

        {/* Achievements Preview */}
        <div className="content-section achievements-section">
          <div className="section-header">
            <h3>🏆 Achievements</h3>
            <Link to="/achievements" className="view-all-link">View All</Link>
          </div>
          <AchievementDisplay showCompact={true} />
          <div className="achievement-preview">
            <p>
              {stage4Stats.achievements?.unlocked_achievements || 0} of{' '}
              {stage4Stats.achievements?.total_achievements || 0} unlocked
            </p>
            {stage4Stats.achievements?.unlocked_achievements === 0 && (
              <p className="encouragement">
                Start studying to unlock your first achievement! 🌟
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/files" className="action-card upload-action">
          <div className="action-icon">📤</div>
          <div className="action-text">
            <span>Upload PDF</span>
            <small>Add new study material</small>
          </div>
        </Link>

        <Link to="/topics" className="action-card topics-action">
          <div className="action-icon">📁</div>
          <div className="action-text">
            <span>Organize Topics</span>
            <small>Create study categories</small>
          </div>
        </Link>

        <Link to="/goals" className="action-card goals-action">
          <div className="action-icon">🎯</div>
          <div className="action-text">
            <span>Set Goals</span>
            <small>Plan your study schedule</small>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
