import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, BookOpen } from 'lucide-react';
import api from '../../services/api';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    totalSessions: 0,
    totalHours: 0,
    pagesRead: 0,
    avgFocus: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/analytics/overview').catch(() => ({ 
        data: { 
          overview: {
            total_sessions: 0,
            total_hours: 0,
            total_pages_read: 0,
            avg_focus_rating: 0
          }
        }
      }));
      
      const overview = response.data.overview || {};
      setAnalytics({
        totalSessions: overview.total_sessions || 0,
        totalHours: overview.total_hours || 0,
        pagesRead: overview.total_pages_read || 0,
        avgFocus: overview.avg_focus_rating || 0
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Study Analytics</h1>
          <p className="text-gray-600">Loading your progress data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Study Analytics</h1>
        <p className="text-gray-600">Track your learning progress and patterns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{analytics.totalHours.toFixed(1)}h</div>
              <div className="text-gray-600">Total Study Time</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen size={24} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{analytics.pagesRead}</div>
              <div className="text-gray-600">Pages Read</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 size={24} className="text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{analytics.totalSessions}</div>
              <div className="text-gray-600">Study Sessions</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp size={24} className="text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{analytics.avgFocus.toFixed(1)}</div>
              <div className="text-gray-600">Avg Focus Rating</div>
            </div>
          </div>
        </div>
      </div>

      {analytics.totalSessions === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
          <h2 className="text-xl font-semibold mb-4">Start Your Analytics Journey</h2>
          <p className="text-gray-600 mb-6">
            Upload some PDFs and complete study sessions to see detailed analytics and insights about your learning patterns.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/files" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Upload First PDF
            </a>
            <a href="/topics" className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200">
              Create Topic
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Enhanced Analytics Coming Soon</h2>
          <p className="text-gray-600">
            Advanced analytics including reading speed trends, focus heatmaps, and detailed progress tracking 
            are being developed for future releases.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
