import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Flame, Target, Moon, Maximize, Coffee, Brain } from 'lucide-react';
import api from '../../services/api';

const CompactSessionToolbar = ({ 
  fileId, 
  currentPage, 
  totalPages, 
  onFocusModeToggle,
  focusModeActive 
}) => {
  const [sessionData, setSessionData] = useState({
    pageTime: 0,
    sessionTime: 0,
    pomodoroActive: false,
    pomodoroTimeLeft: 0,
    pomodoroType: 'focus',
    xpEarned: 0,
    streakDays: 0,
    dailyProgress: 0,
    dailyGoal: 60
  });
  
  const [showDetails, setShowDetails] = useState(false);
  const [pomodoroSessionId, setPomodoroSessionId] = useState(null);

  useEffect(() => {
    loadSessionData();
    const interval = setInterval(loadSessionData, 5000);
    return () => clearInterval(interval);
  }, [fileId]);

  useEffect(() => {
    // Update page time every second when active
    const interval = setInterval(() => {
      if (!focusModeActive) {
        setSessionData(prev => ({
          ...prev,
          pageTime: prev.pageTime + 1,
          sessionTime: prev.sessionTime + 1
        }));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [focusModeActive]);

  const loadSessionData = async () => {
    try {
      // Load user stats (XP, streaks, daily progress)
      const userStatsResponse = await api.get('/user-progress/stats').catch(() => ({
        data: {
          current_streak: 0,
          today_progress: { study_minutes: 0, xp_earned: 0 },
          daily_goal: 60
        }
      }));
      
      setSessionData(prev => ({
        ...prev,
        xpEarned: userStatsResponse.data.today_progress?.xp_earned || 0,
        streakDays: userStatsResponse.data.current_streak || 0,
        dailyProgress: userStatsResponse.data.today_progress?.study_minutes || 0,
        dailyGoal: userStatsResponse.data.daily_goal || 60
      }));
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };

  const startPomodoro = async () => {
    try {
      const response = await api.post('/pomodoro/start', {
        file_id: fileId,
        session_type: 'focus',
        duration_minutes: 25
      });
      
      setPomodoroSessionId(response.data.session.id);
      setSessionData(prev => ({
        ...prev,
        pomodoroActive: true,
        pomodoroTimeLeft: 25 * 60,
        pomodoroType: 'focus'
      }));
      
      // Start countdown
      startPomodoroCountdown();
    } catch (error) {
      console.error('Error starting pomodoro:', error);
    }
  };

  const startPomodoroCountdown = () => {
    const interval = setInterval(() => {
      setSessionData(prev => {
        if (prev.pomodoroTimeLeft <= 1) {
          clearInterval(interval);
          completePomodoroSession();
          return { ...prev, pomodoroTimeLeft: 0, pomodoroActive: false };
        }
        return { ...prev, pomodoroTimeLeft: prev.pomodoroTimeLeft - 1 };
      });
    }, 1000);
  };

  const completePomodoroSession = async () => {
    if (pomodoroSessionId) {
      try {
        await api.post(`/pomodoro/end/${pomodoroSessionId}`, {
          actual_duration_seconds: 25 * 60,
          was_interrupted: false,
          focus_rating: 4
        });
        
        // Show completion notification
        if (Notification.permission === 'granted') {
          new Notification('🎯 Pomodoro Complete!', {
            body: 'Great job! Time for a 5-minute break.',
            icon: '/favicon.ico'
          });
        }
        
        setPomodoroSessionId(null);
        loadSessionData(); // Refresh XP and stats
      } catch (error) {
        console.error('Error completing pomodoro:', error);
      }
    }
  };

  const pausePomodoro = () => {
    setSessionData(prev => ({ ...prev, pomodoroActive: false }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  const formatDetailTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return Math.min((sessionData.dailyProgress / sessionData.dailyGoal) * 100, 100);
  };

  return (
    <div className={`session-toolbar ${focusModeActive ? 'focus-mode' : ''}`}>
      {/* Main Toolbar */}
      <div className="toolbar-main">
        {/* Left - Time Info */}
        <div className="time-section">
          <div className="time-item">
            <Clock size={14} />
            <span>{formatTime(sessionData.pageTime)}</span>
          </div>
          {sessionData.pomodoroActive && (
            <div className="time-item pomodoro">
              <div className="pomodoro-indicator" />
              <span>{formatTime(sessionData.pomodoroTimeLeft)}</span>
            </div>
          )}
        </div>

        {/* Center - Progress */}
        <div className="progress-section">
          <div className="daily-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <span className="progress-text">{sessionData.dailyProgress}/{sessionData.dailyGoal}m</span>
          </div>
        </div>

        {/* Right - Controls */}
        <div className="controls-section">
          <button className="streak-pill" onClick={() => setShowDetails(!showDetails)}>
            <Flame size={12} />
            <span>{sessionData.streakDays}</span>
          </button>
          
          <button className="xp-pill" onClick={() => setShowDetails(!showDetails)}>
            <Target size={12} />
            <span>{sessionData.xpEarned} XP</span>
          </button>

          {/* Pomodoro Control */}
          {!sessionData.pomodoroActive ? (
            <button className="pomodoro-start" onClick={startPomodoro} title="Start 25-min Pomodoro">
              <Brain size={12} />
              <span>25m</span>
            </button>
          ) : (
            <button className="pomodoro-pause" onClick={pausePomodoro} title="Pause Pomodoro">
              <Pause size={12} />
            </button>
          )}
          
          <button 
            className="focus-toggle"
            onClick={onFocusModeToggle}
            title={focusModeActive ? 'Exit Focus Mode' : 'Enter Focus Mode'}
          >
            {focusModeActive ? <Maximize size={14} /> : <Moon size={14} />}
          </button>
          
          <button 
            className="details-toggle"
            onClick={() => setShowDetails(!showDetails)}
          >
            ⋯
          </button>
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="toolbar-details">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">This Page</span>
              <span className="value">{formatDetailTime(sessionData.pageTime)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Session</span>
              <span className="value">{formatDetailTime(sessionData.sessionTime)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Today's Goal</span>
              <span className="value">{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="detail-item">
              <span className="label">Page</span>
              <span className="value">{currentPage} of {totalPages}</span>
            </div>
            <div className="detail-item">
              <span className="label">Streak</span>
              <span className="value">{sessionData.streakDays} days</span>
            </div>
            <div className="detail-item">
              <span className="label">XP Today</span>
              <span className="value">{sessionData.xpEarned}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactSessionToolbar;
