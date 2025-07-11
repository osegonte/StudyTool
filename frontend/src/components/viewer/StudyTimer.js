// frontend/src/components/viewer/StudyTimer.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Square, Clock, Target, TrendingUp, 
  Coffee, Brain, Eye, Settings, Award, AlertCircle
} from 'lucide-react';
import api from '../../services/api';

const StudyTimer = ({ 
  activeSession, 
  onStartSession, 
  onPauseSession, 
  onEndSession,
  sessionStats,
  currentPage,
  totalPages 
}) => {
  // Timer configuration
  const [config, setConfig] = useState({
    workDuration: 25 * 60, // 25 minutes
    shortBreak: 5 * 60,    // 5 minutes
    longBreak: 15 * 60,    // 15 minutes
    autoStartBreaks: true,
    enableNotifications: true
  });
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(config.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [currentMode, setCurrentMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [cycleCount, setCycleCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Session state
  const [focusRating, setFocusRating] = useState(5);
  const [distractions, setDistractions] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [dailyStats, setDailyStats] = useState({
    sessionsCompleted: 0,
    totalMinutes: 0,
    pagesRead: 0,
    avgFocus: 0
  });
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Refs
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const notificationRef = useRef(null);
  
  // Initialize timer when session starts/stops
  useEffect(() => {
    if (activeSession && !isRunning) {
      setIsRunning(true);
      setTimeRemaining(config.workDuration);
      setCurrentMode('work');
    } else if (!activeSession && isRunning) {
      setIsRunning(false);
      setIsPaused(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession, config.workDuration]);
  
  // Main timer countdown
  useEffect(() => {
    if (isRunning && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          // Timer completed
          if (newTime <= 0) {
            handleTimerComplete();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    
    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isPaused, timeRemaining]);
  
  // Load daily stats on mount
  useEffect(() => {
    loadDailyStats();
    requestNotificationPermission();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const loadDailyStats = async () => {
    try {
      const response = await api.get('/user-progress/daily');
      setDailyStats({
        sessionsCompleted: response.data.sessions_completed || 0,
        totalMinutes: response.data.total_study_minutes || 0,
        pagesRead: response.data.pages_read || 0,
        avgFocus: response.data.avg_focus_rating || 0
      });
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  };
  
  const requestNotificationPermission = () => {
    if ('Notification' in window && config.enableNotifications) {
      Notification.requestPermission();
    }
  };
  
  const handleTimerComplete = () => {
    setIsRunning(false);
    playNotificationSound();
    
    if (currentMode === 'work') {
      // Work session completed
      setCycleCount(prev => prev + 1);
      showNotification('Work session complete!', 'Time for a break 🎉');
      
      // Auto-start break if enabled
      if (config.autoStartBreaks) {
        const breakType = cycleCount > 0 && (cycleCount + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
        startBreak(breakType);
      }
      
      // Update session stats
      updateSessionProgress();
      
    } else {
      // Break completed
      showNotification('Break complete!', 'Ready to focus again? 💪');
      setCurrentMode('work');
      setTimeRemaining(config.workDuration);
    }
  };
  
  const startBreak = (breakType) => {
    setCurrentMode(breakType);
    setTimeRemaining(breakType === 'longBreak' ? config.longBreak : config.shortBreak);
    setIsRunning(true);
    setIsPaused(false);
  };
  
  const updateSessionProgress = async () => {
    if (!activeSession) return;
    
    try {
      await api.put(`/study-sessions/${activeSession.id}/progress`, {
        pages_covered: 1, // One page per pomodoro cycle
        focus_rating: focusRating,
        distractions_count: distractions,
        notes: sessionNotes
      });
      
      // Update daily progress
      await api.post('/user-progress/update', {
        study_minutes: config.workDuration / 60,
        pages_read: 1,
        pomodoros_completed: 1
      });
      
      loadDailyStats();
    } catch (error) {
      console.error('Error updating session progress:', error);
    }
  };
  
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };
  
  const showNotification = (title, body) => {
    setNotification({ title, body, timestamp: Date.now() });
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted' && config.enableNotifications) {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'study-timer'
      });
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };
  
  const toggleTimer = () => {
    if (activeSession) {
      if (isPaused) {
        setIsPaused(false);
        setIsRunning(true);
      } else {
        setIsPaused(true);
        setIsRunning(false);
      }
    } else {
      onStartSession();
    }
  };
  
  const stopSession = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(config.workDuration);
    setCurrentMode('work');
    setCycleCount(0);
    onEndSession();
  };
  
  const addDistraction = () => {
    setDistractions(prev => prev + 1);
    setNotification({
      title: 'Distraction noted',
      body: 'Stay focused! You can do this 🎯',
      timestamp: Date.now()
    });
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getProgressPercentage = () => {
    const totalTime = currentMode === 'work' ? config.workDuration :
                     currentMode === 'longBreak' ? config.longBreak : config.shortBreak;
    return ((totalTime - timeRemaining) / totalTime) * 100;
  };
  
  const getModeInfo = () => {
    switch (currentMode) {
      case 'work':
        return { icon: Brain, label: 'Focus Time', color: '#8B5CF6' };
      case 'shortBreak':
        return { icon: Coffee, label: 'Short Break', color: '#10B981' };
      case 'longBreak':
        return { icon: Coffee, label: 'Long Break', color: '#06B6D4' };
      default:
        return { icon: Clock, label: 'Ready', color: '#6B7280' };
    }
  };
  
  const modeInfo = getModeInfo();
  const ModeIcon = modeInfo.icon;
  
  return (
    <div className="study-timer">
      {/* Notification Toast */}
      {notification && (
        <div className="timer-notification">
          <div className="notification-content">
            <strong>{notification.title}</strong>
            <p>{notification.body}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="notification-close"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Timer Header */}
      <div className="timer-header">
        <div className="timer-mode">
          <ModeIcon size={20} style={{ color: modeInfo.color }} />
          <span>{modeInfo.label}</span>
        </div>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="timer-settings-btn"
        >
          <Settings size={16} />
        </button>
      </div>
      
      {/* Main Timer Display */}
      <div className="timer-display">
        <div 
          className="timer-circle"
          style={{
            background: `conic-gradient(${modeInfo.color} ${getProgressPercentage()}%, #f3f4f6 0%)`
          }}
        >
          <div className="timer-inner">
            <div className="timer-time">{formatTime(timeRemaining)}</div>
            <div className="timer-label">
              {isPaused ? 'Paused' : isRunning ? 'Running' : 'Ready'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Timer Controls */}
      <div className="timer-controls">
        <button 
          onClick={toggleTimer}
          className={`timer-btn primary ${!activeSession ? 'pulse' : ''}`}
          disabled={!activeSession && currentMode !== 'work'}
        >
          {isPaused || !isRunning ? <Play size={20} /> : <Pause size={20} />}
          <span>{isPaused ? 'Resume' : isRunning ? 'Pause' : 'Start'}</span>
        </button>
        
        {activeSession && (
          <button onClick={stopSession} className="timer-btn secondary">
            <Square size={16} />
            <span>End</span>
          </button>
        )}
      </div>
      
      {/* Session Progress */}
      {activeSession && (
        <div className="session-progress">
          <div className="progress-item">
            <Target size={16} />
            <div className="progress-content">
              <span className="progress-label">Page Progress</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(currentPage / totalPages) * 100}%` }}
                />
              </div>
              <span className="progress-text">{currentPage} / {totalPages}</span>
            </div>
          </div>
          
          <div className="progress-item">
            <Award size={16} />
            <div className="progress-content">
              <span className="progress-label">Cycles Today</span>
              <span className="progress-value">{cycleCount}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Focus Tracking */}
      <div className="focus-tracking">
        <div className="focus-header">
          <Eye size={16} />
          <span>Focus Level</span>
        </div>
        
        <div className="focus-rating">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              onClick={() => setFocusRating(rating)}
              className={`focus-star ${rating <= focusRating ? 'active' : ''}`}
            >
              ⭐
            </button>
          ))}
        </div>
        
        <div className="distraction-counter">
          <button onClick={addDistraction} className="distraction-btn">
            <AlertCircle size={16} />
            <span>Distraction ({distractions})</span>
          </button>
        </div>
      </div>
      
      {/* Daily Stats */}
      <div className="daily-stats">
        <div className="stats-header">
          <TrendingUp size={16} />
          <span>Today's Progress</span>
          <button 
            onClick={() => setShowStats(!showStats)}
            className="stats-toggle"
          >
            {showStats ? '−' : '+'}
          </button>
        </div>
        
        {showStats && (
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{dailyStats.sessionsCompleted}</div>
              <div className="stat-label">Sessions</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{Math.round(dailyStats.totalMinutes)}</div>
              <div className="stat-label">Minutes</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{dailyStats.pagesRead}</div>
              <div className="stat-label">Pages</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{dailyStats.avgFocus.toFixed(1)}</div>
              <div className="stat-label">Avg Focus</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="timer-settings">
          <div className="settings-header">
            <h3>Timer Settings</h3>
            <button onClick={() => setShowSettings(false)}>×</button>
          </div>
          
          <div className="settings-content">
            <div className="setting-group">
              <label>Work Duration (minutes)</label>
              <input
                type="number"
                value={config.workDuration / 60}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  workDuration: parseInt(e.target.value) * 60
                }))}
                min="1"
                max="60"
              />
            </div>
            
            <div className="setting-group">
              <label>Short Break (minutes)</label>
              <input
                type="number"
                value={config.shortBreak / 60}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  shortBreak: parseInt(e.target.value) * 60
                }))}
                min="1"
                max="30"
              />
            </div>
            
            <div className="setting-group">
              <label>Long Break (minutes)</label>
              <input
                type="number"
                value={config.longBreak / 60}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  longBreak: parseInt(e.target.value) * 60
                }))}
                min="5"
                max="60"
              />
            </div>
            
            <div className="setting-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={config.autoStartBreaks}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    autoStartBreaks: e.target.checked
                  }))}
                />
                Auto-start breaks
              </label>
            </div>
            
            <div className="setting-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={config.enableNotifications}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    enableNotifications: e.target.checked
                  }))}
                />
                Enable notifications
              </label>
            </div>
          </div>
        </div>
      )}
      
      {/* Session Notes */}
      {activeSession && (
        <div className="session-notes">
          <label>Session Notes</label>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="How's this session going? Any insights?"
            rows="3"
          />
        </div>
      )}
      
      {/* Audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
        <source src="/notification-sound.wav" type="audio/wav" />
      </audio>
    </div>
  );
};

export default StudyTimer;