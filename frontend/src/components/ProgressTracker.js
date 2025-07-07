import React from 'react';
import { Clock, BookOpen, TrendingUp } from 'lucide-react';

const ProgressTracker = ({ progress }) => {
  const percentComplete = progress.totalPages > 0 
    ? Math.round((progress.currentPage / progress.totalPages) * 100)
    : 0;

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const estimatedTimeRemaining = () => {
    if (!progress.sessions || progress.sessions.length === 0) {
      return 'Unknown';
    }

    const totalTime = progress.sessions.reduce((sum, session) => sum + session.duration, 0);
    const totalPagesRead = progress.currentPage - 1;
    
    if (totalPagesRead === 0) return 'Unknown';
    
    const avgTimePerPage = totalTime / totalPagesRead;
    const remainingPages = progress.totalPages - progress.currentPage + 1;
    const estimatedSeconds = avgTimePerPage * remainingPages;
    
    return formatTime(estimatedSeconds);
  };

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <h3>Reading Progress</h3>
        <span className="progress-percentage">{percentComplete}%</span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percentComplete}%` }}
        ></div>
      </div>
      
      <div className="progress-stats">
        <div className="stat">
          <BookOpen size={16} />
          <span>{progress.currentPage} / {progress.totalPages} pages</span>
        </div>
        
        <div className="stat">
          <Clock size={16} />
          <span>{formatTime(progress.timeSpent || 0)} total</span>
        </div>
        
        <div className="stat">
          <TrendingUp size={16} />
          <span>{estimatedTimeRemaining()} remaining</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
