import React, { useState, useEffect, useRef } from 'react';
import { Clock, Activity, BarChart3, Pause, Play } from 'lucide-react';
import api from '../services/api';

const EnhancedPageTimer = ({ fileId, currentPage, totalPages }) => {
  const [sessionId, setSessionId] = useState(null);
  const [pageTimers, setPageTimers] = useState({}); // Store time for each page
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPageStartTime, setCurrentPageStartTime] = useState(null);
  const intervalRef = useRef(null);
  const lastPageRef = useRef(currentPage);

  // Auto-start session when component mounts
  useEffect(() => {
    startSession();
    
    return () => {
      if (sessionId) {
        endSession();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fileId]);

  // Handle page changes with memory
  useEffect(() => {
    if (currentPage !== lastPageRef.current && sessionId) {
      handlePageChange(lastPageRef.current, currentPage);
    }
    lastPageRef.current = currentPage;
  }, [currentPage, sessionId]);

  // Timer updates
  useEffect(() => {
    if (isActive && !isPaused && currentPageStartTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - currentPageStartTime) / 1000);
        
        // Update current page time
        setPageTimers(prev => ({
          ...prev,
          [currentPage]: (prev[currentPage] || 0) + 1
        }));
        
        // Update total session time
        setTotalSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, currentPageStartTime, currentPage]);

  const startSession = async () => {
    try {
      const response = await api.post(`/study-sessions/start/${fileId}`, {
        startPage: currentPage,
        sessionType: 'reading'
      });
      
      setSessionId(response.data.session.id);
      setIsActive(true);
      setIsPaused(false);
      setCurrentPageStartTime(Date.now());
      
      // Initialize current page timer if not exists
      setPageTimers(prev => ({
        ...prev,
        [currentPage]: prev[currentPage] || 0
      }));
      
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const handlePageChange = async (fromPage, toPage) => {
    if (!sessionId) return;
    
    try {
      // Record time for previous page
      await api.post(`/study-sessions/page-change/${sessionId}`, {
        fromPage,
        toPage,
        timestamp: new Date().toISOString()
      });
      
      // Check if we're going back to a previously visited page
      const isRevisit = pageTimers[toPage] > 0;
      
      if (isRevisit) {
        // Resuming a previously visited page
        setIsPaused(false);
        setCurrentPageStartTime(Date.now());
      } else {
        // New page - initialize timer
        setPageTimers(prev => ({
          ...prev,
          [toPage]: 0
        }));
        setCurrentPageStartTime(Date.now());
      }
      
    } catch (error) {
      console.error('Error tracking page change:', error);
    }
  };

  const togglePause = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
      setCurrentPageStartTime(Date.now());
    } else {
      // Pause
      setIsPaused(true);
      setCurrentPageStartTime(null);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      await api.post(`/study-sessions/end/${fileId}`, {
        endPage: currentPage,
        notes: `Session completed. Pages visited: ${Object.keys(pageTimers).length}`
      });
      
      setSessionId(null);
      setIsActive(false);
      setIsPaused(false);
      setCurrentPageStartTime(null);
      
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPageTime = () => {
    return pageTimers[currentPage] || 0;
  };

  const getVisitedPagesCount = () => {
    return Object.keys(pageTimers).filter(page => pageTimers[page] > 0).length;
  };

  const isRevisitingPage = () => {
    return pageTimers[currentPage] > 0;
  };

  return (
    <div className="enhanced-page-timer">
      <div className="timer-header">
        <div className="timer-title">
          <Activity size={16} className={isActive && !isPaused ? 'active' : ''} />
          <span>Study Session</span>
        </div>
        <div className="page-indicator">
          <span className="page-number">Page {currentPage} of {totalPages}</span>
          {isRevisitingPage() && (
            <span className="revisit-badge">Revisiting</span>
          )}
        </div>
      </div>
      
      <div className="timer-stats">
        <div className="stat-item">
          <Clock size={14} />
          <div className="stat-info">
            <div className="stat-label">This Page</div>
            <div className="stat-value">{formatTime(getCurrentPageTime())}</div>
          </div>
        </div>
        
        <div className="stat-item">
          <BarChart3 size={14} />
          <div className="stat-info">
            <div className="stat-label">Session Total</div>
            <div className="stat-value">{formatTime(totalSessionTime)}</div>
          </div>
        </div>
      </div>

      <div className="session-controls">
        <div className="session-info">
          <span className="pages-visited">{getVisitedPagesCount()} pages visited</span>
        </div>
        
        <div className="control-buttons">
          <button
            onClick={togglePause}
            className={`control-btn ${isPaused ? 'resume' : 'pause'}`}
            disabled={!isActive}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      <div className="session-status">
        {isActive ? (
          <div className={`status-active ${isPaused ? 'paused' : ''}`}>
            <div className={`pulse-dot ${isPaused ? 'paused' : ''}`}></div>
            <span>{isPaused ? 'Paused' : 'Recording automatically'}</span>
          </div>
        ) : (
          <div className="status-inactive">
            <span>Session ended</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPageTimer;
