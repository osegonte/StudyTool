import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer
} from 'recharts';
import { Clock, BookOpen, TrendingUp } from 'lucide-react';
import { analyticsAPI } from '../../services/api';

const AnalyticsDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [readingSpeedData, setReadingSpeedData] = useState([]);
  const [dailyActivityData, setDailyActivityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [dashboard, speed, activity] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getReadingSpeed(),
        analyticsAPI.getDailyActivity()
      ]);

      setDashboardStats(dashboard.data);
      setReadingSpeedData(speed.data);
      setDailyActivityData(activity.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <Clock size={48} />
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <header className="analytics-header">
        <h1>📊 Phase 2 Analytics</h1>
        <p>Time tracking and reading speed insights</p>
      </header>

      <div className="analytics-summary">
        <div className="summary-card">
          <Clock size={32} />
          <div>
            <h3>{formatTime(dashboardStats?.today?.readingTime || 0)}</h3>
            <p>Today's Reading Time</p>
          </div>
        </div>
        
        <div className="summary-card">
          <BookOpen size={32} />
          <div>
            <h3>{dashboardStats?.today?.pagesRead || 0}</h3>
            <p>Pages Read Today</p>
          </div>
        </div>
        
        <div className="summary-card">
          <TrendingUp size={32} />
          <div>
            <h3>{dashboardStats?.overall?.averageSpeed?.toFixed(1) || 0}</h3>
            <p>Avg Pages/Min</p>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-container">
          <h3>Reading Speed Trend (Phase 2 Focus)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={readingSpeedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avg_speed" stroke="#3498db" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Daily Reading Time (Goal Tracking)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="readingTime" fill="#3498db" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
