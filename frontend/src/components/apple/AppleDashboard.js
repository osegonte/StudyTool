import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Clock, Target, TrendingUp, Play, Upload, 
  Flame, ChevronRight, Activity, Calendar
} from 'lucide-react';
import api from '../../services/api';

const AppleDashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalPages: 0,
    studyTime: 0,
    streak: 0,
    todayGoal: 60,
    todayProgress: 0
  });
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    loadDashboardData();
    setGreeting(getTimeBasedGreeting());
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async () => {
    try {
      const [dashboardRes, progressRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/user-progress/stats').catch(() => ({ data: {} }))
      ]);

      setStats({
        totalFiles: dashboardRes.data.totalFiles || 0,
        totalPages: dashboardRes.data.totalPages || 0,
        studyTime: progressRes.data.today_progress?.study_minutes || 0,
        streak: progressRes.data.current_streak || 0,
        todayGoal: progressRes.data.daily_goal || 60,
        todayProgress: progressRes.data.today_progress?.study_minutes || 0
      });

      setRecentFiles(dashboardRes.data.recentFiles || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    return Math.min((stats.todayProgress / stats.todayGoal) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">
          {greeting}, Victor 👋
        </h1>
        <p className="text-xl text-secondary">
          Ready to continue your learning journey?
        </p>
      </div>

      {/* Primary Action - Continue Sprint */}
      <div className="card mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Continue Your Sprint</h2>
            <p className="text-secondary">Pick up where you left off</p>
          </div>
          <Link to="/sprints" className="btn btn-primary">
            <Play size={20} />
            Start Sprint
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <div className="text-sm text-secondary">Documents</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Target size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(getProgressPercentage())}%</div>
              <div className="text-sm text-secondary">Daily Goal</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Flame size={20} className="text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.streak}</div>
              <div className="text-sm text-secondary">Day Streak</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.studyTime}m</div>
              <div className="text-sm text-secondary">Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Continue Reading</h2>
          <Link to="/files" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        
        {recentFiles.length > 0 ? (
          <div className="space-y-4">
            {recentFiles.slice(0, 3).map(file => (
              <Link
                key={file.id}
                to={`/viewer/${file.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{file.original_name}</div>
                    <div className="text-sm text-secondary">{file.page_count} pages</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Activity size={16} />
                  Continue
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-secondary mb-4">Upload your first PDF to start studying</p>
            <Link to="/files" className="btn btn-primary">
              <Upload size={16} />
              Upload PDF
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/files" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Upload PDF</div>
              <div className="text-sm text-secondary">Add study material</div>
            </div>
          </div>
        </Link>

        <Link to="/topics" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium">Create Topic</div>
              <div className="text-sm text-secondary">Organize materials</div>
            </div>
          </div>
        </Link>

        <Link to="/analytics" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="font-medium">View Analytics</div>
              <div className="text-sm text-secondary">Track progress</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AppleDashboard;
