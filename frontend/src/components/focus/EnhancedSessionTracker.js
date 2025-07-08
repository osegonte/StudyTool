import React, { useState, useEffect } from 'react';
import { Clock, Target, BookOpen, Trophy, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const EnhancedSessionTracker = ({ fileId, currentPage, onSessionData }) => {
  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState({
    startTime: null,
    currentPageTime: 0,
    totalSessionTime: 0,
    pagesVisited: new Set(),
    interactions: [],
    isActive: false
  });
  
  const [dailyStats, setDailyStats] = useState({
    studyMinutes: 0,
    pagesRead: 0,
    xpEarned: 0,
    streakDays: 0,
    goalProgress: 0
  });

  useEffect(() => {
    startSession();
    loadDailyStats();
    
    // Auto-save every 30 seconds
    const saveInterval = setInterval(saveSessionData, 30000);
    
    return () => {
      clearInterval(saveInterval);
      if (sessionId) {
        endSession();
      }
    };
  }, [fileId]);

  useEffect(() => {
    // Track page changes
    if (sessionId && currentPage) {
      trackPageInteraction('view', currentPage);
      updatePagesVisited(currentPage);
    }
  }, [currentPage, sessionId]);

  useEffect(() => {
    // Update timer every second
    if (sessionData.isActive) {
      const interval = setInterval(() => {
        setSessionData(prev => ({
          ...prev,
          currentPageTime: prev.currentPageTime + 1,
          totalSessionTime: prev.totalSessionTime + 1
        }));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [sessionData.isActive]);

  const startSession = async () => {
    try {
      const response = await api.post(`/study-sessions/start/${fileId}`, {
        startPage: currentPage,
        sessionType: 'reading'
      });
      
      const newSessionId = response.data.session.id;
      setSessionId(newSessionId);
      
      setSessionData(prev => ({
        ...prev,
        startTime: Date.now(),
        isActive: true
      }));
      
      // Track study context
      await trackStudyContext(newSessionId);
      
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const trackStudyContext = async (sessionId) => {
    try {
      // Get basic device/environment info
      const context = {
        device_used: navigator.platform || 'Unknown',
        lighting_condition: new Date().getHours() >= 18 ? 'evening' : 'daylight',
        location: 'home' // Could be made configurable
      };
      
      await api.post('/study-contexts', {
        session_id: sessionId,
        ...context
      });
    } catch (error) {
      console.error('Error tracking study context:', error);
    }
  };

  const trackPageInteraction = async (type, pageNumber) => {
    try {
      await api.post('/page-interactions', {
        session_id: sessionId,
        page_number: pageNumber,
        interaction_type: type,
        interaction_start: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking page interaction:', error);
    }
  };

  const updatePagesVisited = (pageNumber) => {
    setSessionData(prev => {
      const newPagesVisited = new Set(prev.pagesVisited);
      newPagesVisited.add(pageNumber);
      
      return {
        ...prev,
        pagesVisited: newPagesVisited,
        currentPageTime: newPagesVisited.has(pageNumber) ? prev.currentPageTime : 0
      };
    });
  };

  const saveSessionData = async () => {
    if (!sessionId) return;
    
    try {
      // Update session duration
      await api.put(`/study-sessions/${sessionId}`, {
        total_duration_seconds: sessionData.totalSessionTime,
        pages_covered: sessionData.pagesVisited.size
      });
      
      // Update daily progress
      await api.post('/user-progress/update', {
        study_minutes: Math.ceil(sessionData.totalSessionTime / 60),
        pages_read: sessionData.pagesVisited.size,
        pomodoros_completed: 0
      });
      
      loadDailyStats();
      
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      await api.post(`/study-sessions/end/${fileId}`, {
        endPage: currentPage,
        notes: `Session completed. ${sessionData.pagesVisited.size} pages visited.`
      });
      
      setSessionData(prev => ({ ...prev, isActive: false }));
      setSessionId(null);
      
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const loadDailyStats = async () => {
    try {
      const response = await api.get('/user-progress/stats');
      const data = response.data;
      
      setDailyStats({
        studyMinutes: data.today_progress?.study_minutes || 0,
        pagesRead: data.today_progress?.pages_read || 0,
        xpEarned: data.today_progress?.xp_earned || 0,
        streakDays: data.current_streak || 0,
        goalProgress: ((data.today_progress?.study_minutes || 0) / (data.daily_goal || 60)) * 100
      });
      
      // Pass data to parent component
      onSessionData?.({
        ...sessionData,
        dailyStats
      });
      
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    sessionData: {
      ...sessionData,
      formattedCurrentPageTime: formatTime(sessionData.currentPageTime),
      formattedTotalTime: formatTime(sessionData.totalSessionTime),
      pagesVisitedCount: sessionData.pagesVisited.size
    },
    dailyStats,
    actions: {
      saveSession: saveSessionData,
      endSession,
      trackPageInteraction
    }
  };
};

export default EnhancedSessionTracker;
