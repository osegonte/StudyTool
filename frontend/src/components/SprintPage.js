import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Square, Timer, Target, BookOpen, 
  Trophy, Flame, BarChart3, CheckCircle
} from 'lucide-react';
import api from '../../services/api';

const SprintPage = () => {
  const [currentSprint, setCurrentSprint] = useState(null);
  const [sprintHistory, setSprintHistory] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sprintStats, setSprintStats] = useState({
    todaySessions: 0,
    totalXP: 0,
    streak: 0,
    averageTime: 0
  });

  useEffect(() => {
    loadSprintData();
    loadSprintHistory();
  }, []);

  useEffect(() => {
    let interval;
    if (sessionActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  const loadSprintData = async () => {
    try {
      const response = await api.get('/user-progress/stats');
      setSprintStats({
        todaySessions: response.data.today_progress?.pomodoros_completed || 0,
        totalXP: response.data.total_xp || 0,
        streak: response.data.current_streak || 0,
        averageTime: 25 // Mock average
      });
    } catch (error) {
      console.error('Error loading sprint data:', error);
    }
  };

  const loadSprintHistory = async () => {
    try {
      const response = await api.get('/pomodoro/stats');
      setSprintHistory(response.data.recent_sessions || []);
    } catch (error) {
      console.error('Error loading sprint history:', error);
    }
  };

  const startSprint = async (fileId, duration = 25) => {
    try {
      const response = await api.post('/pomodoro/start', {
        file_id: fileId,
        session_type: 'focus',
        duration_minutes: duration
      });
      
      setCurrentSprint({
        id: response.data.session.id,
        fileId,
        duration: duration * 60,
        startTime: Date.now()
      });
      setSessionActive(true);
      setSessionTime(0);
    } catch (error) {
      console.error('Error starting sprint:', error);
    }
  };

  const pauseSprint = () => {
    setSessionActive(false);
  };

  const resumeSprint = () => {
    setSessionActive(true);
  };

  const endSprint = async () => {
    if (!currentSprint) return;

    try {
      await api.post(`/pomodoro/end/${currentSprint.id}`, {
        actual_duration_seconds: sessionTime,
        was_interrupted: false,
        focus_rating: 4
      });
      
      setCurrentSprint(null);
      setSessionActive(false);
      setSessionTime(0);
      
      // Show completion feedback
      showCompletionFeedback();
      
      // Reload data
      loadSprintData();
      loadSprintHistory();
    } catch (error) {
      console.error('Error ending sprint:', error);
    }
  };

  const showCompletionFeedback = () => {
    const feedback = document.createElement('div');
    feedback.className = 'sprint-completion-toast';
    feedback.innerHTML = '🏆 Sprint Complete! +20 XP — 2m above average!';
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      document.body.removeChild(feedback);
    }, 3000);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    if (!currentSprint) return 0;
    return Math.max(0, currentSprint.duration - sessionTime);
  };

  return (
    <div className="sprint-page">
      <div className="sprint-header">
        <h1>Study Sprints</h1>
        <p>Focused study sessions for maximum productivity</p>
      </div>

      {/* Today's Sprint Card */}
      <div className="todays-sprint-card">
        {currentSprint ? (
          <div className="active-sprint">
            <div className="sprint-info">
              <h3>Active Sprint</h3>
              <p>Pages 11–20 • {Math.floor(currentSprint.duration / 60)}m session</p>
            </div>
            
            <div className="sprint-timer">
              <div className="timer-display">
                <Timer size={32} />
                <span className="time-text">
                  {formatTime(getTimeRemaining())}
                </span>
              </div>
              <div className="timer-progress">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${(sessionTime / currentSprint.duration) * 100}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="sprint-controls">
              {sessionActive ? (
                <button className="btn-secondary" onClick={pauseSprint}>
                  <Pause size={20} />
                  Pause
                </button>
              ) : (
                <button className="btn-primary" onClick={resumeSprint}>
                  <Play size={20} />
                  Resume
                </button>
              )}
              
              <button className="btn-primary" onClick={endSprint}>
                <CheckCircle size={20} />
                Mark as Done
              </button>
            </div>
          </div>
        ) : (
          <div className="start-sprint">
            <div className="sprint-preview">
              <h3>Ready for a Sprint?</h3>
              <p>Choose a duration and start your focused study session</p>
            </div>
            
            <div className="sprint-options">
              <button 
                className="sprint-option"
                onClick={() => startSprint('mock-file-id', 15)}
              >
                <Timer size={20} />
                <span>15 min</span>
              </button>
              
              <button 
                className="sprint-option primary"
                onClick={() => startSprint('mock-file-id', 25)}
              >
                <Timer size={20} />
                <span>25 min</span>
              </button>
              
              <button 
                className="sprint-option"
                onClick={() => startSprint('mock-file-id', 45)}
              >
                <Timer size={20} />
                <span>45 min</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sprint Stats */}
      <div className="sprint-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <h3>{sprintStats.todaySessions}</h3>
            <p>Sprints Today</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Trophy size={24} />
          </div>
          <div className="stat-content">
            <h3>{sprintStats.totalXP}</h3>
            <p>Total XP</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Flame size={24} />
          </div>
          <div className="stat-content">
            <h3>{sprintStats.streak}</h3>
            <p>Day Streak</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
