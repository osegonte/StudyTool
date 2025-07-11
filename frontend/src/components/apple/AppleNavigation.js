import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, FileText, Folder, Timer, BarChart3, Target, 
  Settings, StickyNote, User, Zap
} from 'lucide-react';

const AppleNavigation = () => {
  const location = useLocation();

  const mainNavItems = [
    { path: '/', icon: Home, label: 'Dashboard', badge: null },
    { path: '/files', icon: FileText, label: 'Documents', badge: '5' },
    { path: '/topics', icon: Folder, label: 'Topics', badge: null },
  ];

  const studyNavItems = [
    { path: '/sprints', icon: Timer, label: 'Study Sprints', badge: '2' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', badge: null },
    { path: '/goals', icon: Target, label: 'Goals', badge: '3' },
  ];

  const toolsNavItems = [
    { path: '/notes', icon: StickyNote, label: 'Smart Notes', badge: null },
    { path: '/settings', icon: Settings, label: 'Settings', badge: null },
  ];

  const NavSection = ({ title, items }) => (
    <div className="nav-section">
      <div className="nav-section-title">{title}</div>
      {items.map(({ path, icon: Icon, label, badge }) => (
        <Link 
          key={path}
          to={path} 
          className={`nav-link ${
            location.pathname === path || 
            (path !== '/' && location.pathname.startsWith(path)) 
              ? 'active' 
              : ''
          }`}
        >
          <div className="nav-icon">
            <Icon size={20} />
          </div>
          <span className="nav-text">{label}</span>
          {badge && <span className="nav-badge">{badge}</span>}
        </Link>
      ))}
    </div>
  );

  return (
    <nav className="sprintstudy-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Zap size={20} />
          </div>
          <div className="sidebar-title">
            <h1>SprintStudy</h1>
            <p className="sidebar-subtitle">Smart Study Planner</p>
          </div>
        </div>
      </div>

      <div className="sidebar-nav">
        <NavSection title="Main" items={mainNavItems} />
        <NavSection title="Study" items={studyNavItems} />
        <NavSection title="Tools" items={toolsNavItems} />
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <User size={16} />
          </div>
          <div className="user-info">
            <div className="user-name">Study Session</div>
            <div className="user-status">Ready to learn</div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AppleNavigation;
