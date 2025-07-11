import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, BookOpen, Target, TrendingUp, Calendar, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../services/api';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({});
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      
      const [overviewRes, streaksRes, progressRes] = await Promise.all([
        api.get(`/analytics/overview?days=${days}`).catch(() => ({ data: {} })),
        api.get('/analytics/streaks').catch(() => ({ data: {} })),
        api.get('/user-progress/stats').catch(() => ({ data: {} }))
      ]);

      setAnalytics({
        overview: overviewRes.data || {},
        streaks: streaksRes.data || {},
        progress: progressRes.data || {}
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      minutes: Math.floor(Math.random() * 120) + 30,
      pages: Math.floor(Math.random() * 20) + 5,
      focus: Math.random() * 2 + 3
    }));
  };

  const studyData = generateMockData();

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>📊 Study Analytics</h1>
        <p>Track your learning progress and patterns</p>
        
        <div className="analytics-controls">
          <div className="time-range-selector">
            <button 
              className={`range-btn ${timeRange === '7days' ? 'active' : ''}`}
              onClick={() => setTimeRange('7days')}
            >
              7 Days
            </button>
            <button 
              className={`range-btn ${timeRange === '30days' ? 'active' : ''}`}
              onClick={()#!/bin/bash

# Study Planner Comprehensive Update Script
# This script updates all components to match the latest specifications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 Starting Study Planner Comprehensive Update..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Updating backend dependencies and structure..."

# Update backend package.json with all required dependencies
cat > backend/package.json << 'EOF'
{
  "name": "local-study-planner-backend",
  "version": "2.0.0",
  "description": "Local Study Planner Backend - Complete Feature Set",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "migrate": "node src/migrate.js",
    "seed": "node src/seed.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "fs-extra": "^11.1.0",
    "multer": "^1.4.5-lts.1",
    "pdf-parse": "^1.1.1",
    "pg": "^8.11.3",
    "uuid": "^9.0.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
