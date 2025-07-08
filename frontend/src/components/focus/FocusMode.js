import React, { useState, useEffect } from 'react';
import { Maximize, Minimize, Moon, Sun, X } from 'lucide-react';

const FocusMode = ({ isActive, onToggle, children, currentMode = 'normal' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isActive) {
      document.body.classList.add('focus-mode-active');
      if (currentMode === 'late_night') {
        setIsDarkMode(true);
      }
    } else {
      document.body.classList.remove('focus-mode-active');
    }

    return () => {
      document.body.classList.remove('focus-mode-active');
    };
  }, [isActive, currentMode]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const getModeStyles = () => {
    switch (currentMode) {
      case 'focus':
        return 'focus-mode-minimal';
      case 'celebration':
        return 'focus-mode-celebration';
      case 'late_night':
        return 'focus-mode-dark';
      default:
        return 'focus-mode-normal';
    }
  };

  if (!isActive) {
    return (
      <div className="focus-mode-trigger">
        <button 
          onClick={onToggle}
          className="btn btn-secondary focus-toggle-btn"
          title="Enter Focus Mode"
        >
          <Maximize size={16} />
          Focus Mode
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className={`focus-mode-container ${getModeStyles()}`}>
      <div className="focus-mode-header">
        <div className="focus-mode-controls">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="focus-control-btn"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="focus-control-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          
          <button
            onClick={onToggle}
            className="focus-control-btn exit-focus"
            title="Exit Focus Mode"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div className={`focus-mode-content ${isDarkMode ? 'dark' : 'light'}`}>
        {children}
      </div>
    </div>
  );
};

export default FocusMode;
