import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, BookOpen, Target, TrendingUp, Calendar } from 'lucide-react';
import api from '../../services/api';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    totalSessions: 0,
    totalHours: 0,
    averageSession: 0,
    pagesRead: 0,
    currentStreak: 0,
    weeklyData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [progressRes, analyticsRes] = await Promise.all([
        api.get('/user-progress/stats'),
        api.get('/analytics/overview?days=30').catch(() => ({ data: {} }))
      ]);

      setAnalytics({
        totalSessions: analyticsRes.data?.overview?.total_sessions || 0,
        totalHours: Math.round((analyticsRes.data?.overview?.total_hours || 0) * 10) / 10,
        averageSession: Math.round((analyticsRes.data?.overview?.avg_session_minutes || 0) * 10) / 10,
        pagesRead: analyticsRes.data?.overview?.total_pages_read || 0,
        currentStreak: progressRes.data?.current_streak || 0,
        weeklyData: analyticsRes.data?.daily_progress || []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-xl text-secondary">
          Track your learning progress and patterns
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{analytics.totalSessions}</div>
              <div className="text-sm text-secondary">Total Sessions</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Clock size={20} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{analytics.totalHours}h</div>
              <div className="text-sm text-secondary">Total Study Time</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <BookOpen size={20} className="text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{analytics.pagesRead}</div>
              <div className="text-sm text-secondary">Pages Read</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Target size={20} className="text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{analytics.averageSession}m</div>
              <div className="text-sm text-secondary">Avg Session</div>
            </div>
          </div>
        </div>
      </div>

      {/* Study Pattern */}
      <div className="card mb-8">
        <h2 className="text-2xl font-semibold mb-6">Study Pattern</h2>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
              </div>
              <div className="h-32 bg-gray-100 rounded-lg flex items-end justify-center p-2">
                <div 
                  className="bg-blue-500 rounded w-6 transition-all duration-300"
                  style={{ height: `${Math.random() * 80 + 20}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-2xl font-semibold mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { action: 'Completed reading session', time: '2 hours ago', icon: BookOpen },
            { action: 'Reached daily goal', time: 'Yesterday', icon: Target },
            { action: 'Extended study streak', time: '2 days ago', icon: TrendingUp },
            { action: 'Uploaded new document', time: '3 days ago', icon: Calendar },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <activity.icon size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{activity.action}</div>
                <div className="text-sm text-gray-500">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
