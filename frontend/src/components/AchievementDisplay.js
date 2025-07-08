import React, { useState, useEffect } from 'react';
import { Trophy, Award, Star, Crown, Target, Flame } from 'lucide-react';
import api from '../services/api';

const AchievementDisplay = ({ showCompact = false }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState([]);

  useEffect(() => {
    loadAchievements();
    checkForNewAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const response = await api.get('/achievements');
      setAchievements(response.data.achievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewAchievements = async () => {
    try {
      // Get current user progress for achievement checking
      const progressResponse = await api.get('/user-progress/stats');
      const analyticsResponse = await api.get('/analytics/overview?days=365').catch(() => ({ data: {} }));
      
      const progressData = {
        total_pages_read: progressResponse.data.today_progress?.pages_read || 0,
        current_streak: progressResponse.data.current_streak || 0,
        longest_session_minutes: analyticsResponse.data?.overview?.avg_session_minutes || 0,
        goal_streak: 0, // Would need to calculate from goals data
        max_daily_pages: 0, // Would need to calculate from daily maximums
        total_pomodoros: 0 // Would need to get from pomodoro stats
      };

      const achievementCheck = await api.post('/achievements/check', {
        user_progress_data: progressData
      });

      if (achievementCheck.data.new_achievements.length > 0) {
        setNewAchievements(achievementCheck.data.new_achievements);
        // Show celebration for new achievements
        achievementCheck.data.new_achievements.forEach(achievement => {
          showAchievementNotification(achievement);
        });
        loadAchievements(); // Reload to show newly unlocked achievements
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const showAchievementNotification = (achievement) => {
    if (Notification.permission === 'granted') {
      new Notification(`🏆 Achievement Unlocked!`, {
        body: `${achievement.title} - +${achievement.xp_reward} XP`,
        icon: '/favicon.ico'
      });
    }
  };

  const getAchievementIcon = (badgeKey) => {
    const iconMap = {
      first_steps: Star,
      steady_reader: Target,
      marathon_mode: Crown,
      time_hacker: Trophy,
      consistency_king: Crown,
      speed_reader: Flame,
      focus_master: Award,
      night_owl: Crown,
      early_bird: Star,
      streak_legend: Flame
    };
    return iconMap[badgeKey] || Trophy;
  };

  if (loading) {
    return <div className="achievement-loading">Loading achievements...</div>;
  }

  const unlockedAchievements = achievements.filter(a => a.is_unlocked);
  const lockedAchievements = achievements.filter(a => !a.is_unlocked);

  if (showCompact) {
    return (
      <div className="achievement-compact">
        <div className="achievement-summary">
          <Trophy className="achievement-icon" />
          <span className="achievement-count">
            {unlockedAchievements.length}/{achievements.length}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="achievement-display">
      <div className="achievement-header">
        <h3>🏆 Achievements</h3>
        <div className="achievement-progress">
          <span className="progress-text">
            {unlockedAchievements.length} of {achievements.length} unlocked
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${(unlockedAchievements.length / achievements.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>

      <div className="achievement-grid">
        {achievements.map(achievement => {
          const IconComponent = getAchievementIcon(achievement.badge_key);
          return (
            <div 
              key={achievement.id} 
              className={`achievement-card ${achievement.is_unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon-container">
                <IconComponent 
                  size={24} 
                  className={achievement.is_unlocked ? 'unlocked-icon' : 'locked-icon'}
                />
                {achievement.is_unlocked && (
                  <div className="achievement-unlock-badge">✓</div>
                )}
              </div>
              
              <div className="achievement-content">
                <h4 className="achievement-title">{achievement.title}</h4>
                <p className="achievement-description">{achievement.description}</p>
                <div className="achievement-reward">
                  <span className="xp-reward">+{achievement.xp_reward} XP</span>
                  {achievement.unlocked_at && (
                    <span className="unlock-date">
                      {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              {!achievement.is_unlocked && !achievement.is_secret && (
                <div className="achievement-progress-hint">
                  <div className="progress-hint">
                    Keep studying to unlock!
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {newAchievements.length > 0 && (
        <div className="new-achievement-celebration">
          <div className="celebration-content">
            <h4>🎉 New Achievement{newAchievements.length > 1 ? 's' : ''} Unlocked!</h4>
            {newAchievements.map(achievement => (
              <div key={achievement.achievement_id} className="new-achievement-item">
                <strong>{achievement.title}</strong> - +{achievement.xp_reward} XP
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementDisplay;
