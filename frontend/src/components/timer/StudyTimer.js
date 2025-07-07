import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionsAPI } from '../../services/api';

const StudyTimer = ({ fileId, currentPage, onSessionEnd }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = async () => {
    try {
      const response = await sessionsAPI.start({
        fileId,
        startPage: currentPage
      });
      
      setSessionId(response.data.sessionId);
      setIsRunning(true);
      setTime(0);
      toast.success('Study session started!');
    } catch (error) {
      toast.error('Failed to start session');
      console.error('Error starting session:', error);
    }
  };

  const pauseSession = () => {
    setIsRunning(false);
    toast('Session paused');
  };

  const endSession = async (notes = '') => {
    if (!sessionId) return;

    try {
      const response = await sessionsAPI.end(sessionId, {
        endPage: currentPage,
        notes
      });

      setIsRunning(false);
      setTime(0);
      setSessionId(null);
      
      toast.success(`Session completed! ${response.data.pagesRead} pages read`);
      
      if (onSessionEnd) {
        onSessionEnd(response.data);
      }
    } catch (error) {
      toast.error('Failed to end session');
      console.error('Error ending session:', error);
    }
  };

  return (
    <div className="study-timer">
      <div className="timer-display">
        <Clock size={20} />
        <span className="time-text">{formatTime(time)}</span>
      </div>
      
      <div className="timer-controls">
        {!isRunning && !sessionId && (
          <button onClick={startSession} className="timer-btn start-btn">
            <Play size={16} />
            Start
          </button>
        )}
        
        {isRunning && (
          <button onClick={pauseSession} className="timer-btn pause-btn">
            <Pause size={16} />
            Pause
          </button>
        )}
        
        {sessionId && (
          <button onClick={() => endSession()} className="timer-btn stop-btn">
            <Square size={16} />
            End
          </button>
        )}
      </div>
    </div>
  );
};

export default StudyTimer;
