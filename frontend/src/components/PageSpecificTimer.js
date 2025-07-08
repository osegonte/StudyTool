import React, { useState, useEffect, useRef } from 'react';
import { Clock, Activity, BarChart3 } from 'lucide-react';
import api from '../services/api';

const PageSpecificTimer = ({ fileId, currentPage }) => {
  const [sessionId, setSessionId] = useState(null);
  const [pageStartTime, setPageStartTime] = useState(null);
  const [currentPageTime, setCurrentPageTime] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
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

  // Handle page changes automatically
  useEffect(() => {
    if (currentPage !== lastPageRef.current && sessionId) {
      handlePageChange(lastPageRef.current, currentPage);
    }
    lastPageRef.current = currentPage;
  }, [currentPage, sessionId]);

  // Timer updates
  useEffect(() => {
    if (isActive && pageStartTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const pageTime = Math.floor((now - pageStartTime) / 1000);
        setCurrentPageTime(pageTime);
        
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
  }, [isActive, pageStartTime]);

  const startSession = async () => {
    try {
      const response = await api.post(`/study-sessions/start/${fileId}`, {
        startPage: currentPage,
        sessionType: 'reading'
      });
      
      setSessionId(response.data.session.id);
      setIsActive(true);
      setPageStartTime(Date.now());
      setCurrentPageTime(0);
      setTotalSessionTime(0);
      
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
      
      // Reset timer for new page
      setPageStartTime(Date.now());
      setCurrentPageTime(0);
      
    } catch (error) {
      console.error('Error tracking page change:', error);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      await api.post(`/study-sessions/end/${fileId}`, {
        endPage: currentPage,
        notes: `Session completed at page ${currentPage}`
      });
      
      setSessionId(null);
      setIsActive(false);
      setPageStartTime(null);
      
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page-specific-timer">
      <div className="timer-header">
        <div className="timer-title">
          <Activity size={16} className={isActive ? 'active' : ''} />
          <span>Study Session</span>
        </div>
        <div className="page-indicator">
          Page {currentPage}
        </div>
      </div>
      
      <div className="timer-stats">
        <div className="stat-item">
          <Clock size={14} />
          <div className="stat-info">
            <div className="stat-label">This Page</div>
            <div className="stat-value">{formatTime(currentPageTime)}</div>
          </div>
        </div>
        
        <div className="stat-item">
          <BarChart3 size={14} />
          <div className="stat-info">
            <div className="stat-label">Total Session</div>
            <div className="stat-value">{formatTime(totalSessionTime)}</div>
          </div>
        </div>
      </div>

      <div className="session-status">
        {isActive ? (
          <div className="status-active">
            <div className="pulse-dot"></div>
            <span>Recording automatically</span>
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

export default PageSpecificTimer;
