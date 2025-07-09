import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Folder, BookOpen, StickyNote, Trophy } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/files', icon: FileText, label: 'File Manager' },
    { path: '/topics', icon: Folder, label: 'Topics' },
    { path: '/notes', icon: StickyNote, label: 'Smart Notes' },
    { path: '/achievements', icon: Trophy, label: 'Achievements' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <BookOpen className="nav-logo" />
        <h1>Study Planner</h1>
      </div>
      <ul className="nav-links">
        {navItems.map(({ path, icon: Icon, label }) => (
          <li key={path}>
            <Link 
              to={path} 
              className={`nav-link ${location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;
