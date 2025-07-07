import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { Calendar, Clock, BookOpen, Target, TrendingUp } from 'lucide-react';
import { analyticsAPI } from '../../services/api';

const COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];

const AnalyticsDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [readingSpeedData, setReadingSpeedData] = useState([]);
  const [dailyActivityData, setDailyActivityData] = useState([]);
  const [topicDistribution, setTopicDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [dashboard, speed, activity, topics] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getReadingSpeed(),
        analyticsAPI.getDailyActivity(),
        analyticsAPI.getTopicsDistribution()
      ]);

      setDashboardStats(dashboard.data);
      setReadingSpeedData(speed.data);
      setDailyActivityData(activity.data);
      setTopicDistribution(topics.data);
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
        <h1>📊 Study Analytics</h1>
        <p>Insights into your learning patterns and progress</p>
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
        
        <div className="summary-card">
          <Target size={32} />
          <div>
            <h3>{dashboardStats?.overall?.activeGoals || 0}</h3>
            <p>Active Goals</p>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-container">
          <h3>Reading Speed Trend</h3>
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
          <h3>Daily Study Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="readingTime" fill="#3498db" />
              <Bar dataKey="pagesRead" fill="#2ecc71" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Time by Topic</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topicDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="total_time"
                label={({ name, value }) => `${name}: ${formatTime(value)}`}
              >
                {topicDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
