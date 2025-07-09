import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, FileText, Folder, BookOpen, StickyNote, Trophy, 
  Menu, X, Activity, BarChart3, Settings, Timer 
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const EnhancedNavigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard', description: 'Overview & Stats' },
    { path: '/files', icon: FileText, label: 'Documents', description: 'PDFs & Files' },
    { path: '/topics', icon: Folder, label: 'Topics', description: 'Study Categories' },
    { path: '/sprints', icon: Timer, label: 'Sprints', description: 'Focus Sessions' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', description: 'Progress Insights' },
    { path: '/notes', icon: StickyNote, label: 'Notes', description: 'Knowledge Base' },
    { path: '/achievements', icon: Trophy, label: 'Achievements', description: 'Progress & Rewards' },
    { path: '/settings', icon: Settings, label: 'Settings', description: 'Preferences' },
  ];

  const isActive = (path) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <>
      <button 
        className="mobile-nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav className={`navigation ${isOpen ? 'open' : ''}`}>
        <div className="nav-header">
          <BookOpen className="nav-logo" />
          <div>
            <h1>Study Planner</h1>
            <p className="nav-subtitle">Your Learning Hub</p>
          </div>
        </div>
        
        <ul className="nav-links">
          {navItems.map(({ path, icon: Icon, label, description }) => (
            <li key={path}>
              <Link 
                to={path} 
                className={`nav-link ${isActive(path) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} className="icon" />
                <div className="nav-link-content">
                  <span className="nav-link-label">{label}</span>
                  <span className="nav-link-description">{description}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-footer">
          <div className="nav-controls">
            <ThemeToggle />
          </div>
          <div className="nav-stats">
            <div className="stat-item">
              <span className="stat-label">Study Streak</span>
              <span className="stat-value">🔥 0 days</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total XP</span>
              <span className="stat-value">⭐ 0 points</span>
            </div>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div 
          className="nav-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default EnhancedNavigation;
