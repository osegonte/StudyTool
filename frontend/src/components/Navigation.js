import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Folder, BookOpen } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/files', icon: FileText, label: 'File Manager' },
    { path: '/topics', icon: Folder, label: 'Topics' },
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
              className={`nav-link ${location.pathname === path ? 'active' : ''}`}
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
