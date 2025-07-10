import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, FileText, Folder, Timer, BarChart3, StickyNote, 
  Trophy, Settings, BookOpen
} from 'lucide-react';

const AppleNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/files', icon: FileText, label: 'Documents' },
    { path: '/topics', icon: Folder, label: 'Topics' },
    { path: '/sprints', icon: Timer, label: 'Sprints' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/notes', icon: StickyNote, label: 'Notes' },
    { path: '/achievements', icon: Trophy, label: 'Achievements' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Study Planner</h1>
            <p className="text-xs text-gray-500">Focus & Learn</p>
          </div>
        </div>

        <ul className="space-y-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <li key={path}>
              <Link
                to={path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Study Streak</span>
            <span className="font-medium">🔥 0 days</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total XP</span>
            <span className="font-medium">⭐ 0 points</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AppleNavigation;
