#!/bin/bash

echo "🎨 Creating Phase 2 Frontend Components"
echo "======================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Create Study Timer Component
print_info "Creating Study Timer Component..."
cat > frontend/src/components/timer/StudyTimer.js << 'EOF'
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionsAPI } from '../../services/api';

const StudyTimer = ({ fileId, currentPage, onSessionEnd }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = async () => {
    try {
      const response = await sessionsAPI.start({
        fileId,
        startPage: currentPage
      });
      
      setSessionId(response.data.sessionId);
      setIsRunning(true);
      setTime(0);
      toast.success('Study session started!');
    } catch (error) {
      toast.error('Failed to start session');
      console.error('Error starting session:', error);
    }
  };

  const pauseSession = () => {
    setIsRunning(false);
    toast('Session paused');
  };

  const endSession = async (notes = '') => {
    if (!sessionId) return;

    try {
      const response = await sessionsAPI.end(sessionId, {
        endPage: currentPage,
        notes
      });

      setIsRunning(false);
      setTime(0);
      setSessionId(null);
      
      toast.success(`Session completed! ${response.data.pagesRead} pages read`);
      
      if (onSessionEnd) {
        onSessionEnd(response.data);
      }
    } catch (error) {
      toast.error('Failed to end session');
      console.error('Error ending session:', error);
    }
  };

  return (
    <div className="study-timer">
      <div className="timer-display">
        <Clock size={20} />
        <span className="time-text">{formatTime(time)}</span>
      </div>
      
      <div className="timer-controls">
        {!isRunning && !sessionId && (
          <button onClick={startSession} className="timer-btn start-btn">
            <Play size={16} />
            Start
          </button>
        )}
        
        {isRunning && (
          <button onClick={pauseSession} className="timer-btn pause-btn">
            <Pause size={16} />
            Pause
          </button>
        )}
        
        {sessionId && (
          <button onClick={() => endSession()} className="timer-btn stop-btn">
            <Square size={16} />
            End
          </button>
        )}
      </div>
    </div>
  );
};

export default StudyTimer;
EOF

print_status "Study Timer component created"

# Create Analytics Dashboard
print_info "Creating Analytics Dashboard..."
cat > frontend/src/components/analytics/AnalyticsDashboard.js << 'EOF'
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
EOF

print_status "Analytics Dashboard created"

# Create Goals Manager
print_info "Creating Goals Manager..."
cat > frontend/src/components/goals/GoalsManager.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { Plus, Target, Calendar, Clock, BookOpen, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import { goalsAPI, filesAPI, topicsAPI } from '../../services/api';
import "react-datepicker/dist/react-datepicker.css";

const GoalsManager = () => {
  const [goals, setGoals] = useState([]);
  const [files, setFiles] = useState([]);
  const [topics, setTopics] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetType: 'daily_minutes',
    targetValue: 60,
    startDate: new Date(),
    endDate: null,
    fileId: '',
    topicId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsRes, filesRes, topicsRes] = await Promise.all([
        goalsAPI.getAll(),
        filesAPI.getAll(),
        topicsAPI.getAll()
      ]);

      setGoals(goalsRes.data);
      setFiles(filesRes.data);
      setTopics(topicsRes.data);
    } catch (error) {
      console.error('Error loading goals data:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    try {
      await goalsAPI.create(newGoal);
      toast.success('Goal created successfully!');
      setShowCreateForm(false);
      setNewGoal({
        title: '',
        description: '',
        targetType: 'daily_minutes',
        targetValue: 60,
        startDate: new Date(),
        endDate: null,
        fileId: '',
        topicId: ''
      });
      loadData();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const deleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    try {
      await goalsAPI.delete(goalId);
      toast.success('Goal deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const getGoalTypeIcon = (type) => {
    switch (type) {
      case 'daily_minutes': return <Clock size={20} />;
      case 'pages_per_day': return <BookOpen size={20} />;
      case 'completion_date': return <Calendar size={20} />;
      default: return <Target size={20} />;
    }
  };

  const calculateProgress = (goal) => {
    if (!goal.current_progress || !goal.target_value) return 0;
    return Math.min((goal.current_progress / goal.target_value) * 100, 100);
  };

  if (loading) {
    return (
      <div className="goals-loading">
        <Target size={48} />
        <p>Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="goals-manager">
      <header className="goals-header">
        <div>
          <h1>🎯 Study Goals</h1>
          <p>Set and track your learning objectives</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="create-goal-btn"
        >
          <Plus size={20} />
          Create Goal
        </button>
      </header>

      <div className="goals-list">
        {goals.length === 0 ? (
          <div className="no-goals">
            <Target size={64} />
            <h3>No goals set yet</h3>
            <p>Create your first study goal to start tracking progress</p>
          </div>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className="goal-card">
              <div className="goal-header">
                <div className="goal-title">
                  {getGoalTypeIcon(goal.target_type)}
                  <h3>{goal.title}</h3>
                </div>
                <button 
                  onClick={() => deleteGoal(goal.id)}
                  className="goal-action-btn delete-btn"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="goal-description">{goal.description}</p>

              <div className="goal-progress">
                <div className="progress-header">
                  <span>Progress</span>
                  <span>{calculateProgress(goal).toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${calculateProgress(goal)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New Goal</h2>
            
            <div className="form-group">
              <label>Goal Title</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                placeholder="e.g., Read 30 minutes daily"
              />
            </div>

            <div className="form-group">
              <label>Target Value</label>
              <input
                type="number"
                value={newGoal.targetValue}
                onChange={(e) => setNewGoal({...newGoal, targetValue: parseFloat(e.target.value)})}
                min="1"
              />
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowCreateForm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={createGoal}
                className="create-btn"
                disabled={!newGoal.title.trim()}
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsManager;
EOF

print_status "Goals Manager created"

# Create Enhanced API Service
print_info "Creating Enhanced API Service..."
cat > frontend/src/services/api.js << 'EOF'
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const filesAPI = {
  getAll: () => api.get('/files'),
  upload: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (fileId) => api.delete(`/files/${fileId}`),
  getMetadata: (fileId) => api.get(`/files/${fileId}/metadata`)
};

export const progressAPI = {
  get: (fileId) => api.get(`/progress/${fileId}`),
  update: (fileId, data) => api.post(`/progress/${fileId}`, data),
  getAll: () => api.get('/progress')
};

export const sessionsAPI = {
  start: (data) => api.post('/sessions/start', data),
  end: (sessionId, data) => api.post(`/sessions/end/${sessionId}`, data),
  getByFile: (fileId) => api.get(`/sessions/file/${fileId}`),
  getAll: (params) => api.get('/sessions/all', { params })
};

export const goalsAPI = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (goalId, data) => api.put(`/goals/${goalId}`, data),
  delete: (goalId) => api.delete(`/goals/${goalId}`)
};

export const topicsAPI = {
  getAll: () => api.get('/topics'),
  create: (data) => api.post('/topics', data),
  update: (topicId, data) => api.put(`/topics/${topicId}`, data),
  delete: (topicId) => api.delete(`/topics/${topicId}`)
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getReadingSpeed: (period = '30') => api.get('/analytics/reading-speed', { params: { period } }),
  getDailyActivity: (days = '30') => api.get('/analytics/daily-activity', { params: { days } }),
  getTopicsDistribution: () => api.get('/analytics/topics-distribution')
};

export default api;
EOF

print_status "API service created"

# Create Pages
print_info "Creating Pages..."
cat > frontend/src/pages/Analytics.js << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';

const Analytics = () => {
  return (
    <div className="analytics-page">
      <nav className="page-nav">
        <Link to="/" className="nav-link">
          <Home size={20} />
          Home
        </Link>
      </nav>
      <AnalyticsDashboard />
    </div>
  );
};

export default Analytics;
EOF

cat > frontend/src/pages/Goals.js << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import GoalsManager from '../components/goals/GoalsManager';

const Goals = () => {
  return (
    <div className="goals-page">
      <nav className="page-nav">
        <Link to="/" className="nav-link">
          <Home size={20} />
          Home
        </Link>
      </nav>
      <GoalsManager />
    </div>
  );
};

export default Goals;
EOF

print_status "Pages created"

# Update App.js
print_info "Updating App.js..."
cat > frontend/src/App.js << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import PDFViewer from './pages/PDFViewer';
import FileManager from './pages/FileManager';
import Analytics from './pages/Analytics';
import Goals from './pages/Goals';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/files" element={<FileManager />} />
          <Route path="/pdf/:id" element={<PDFViewer />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/goals" element={<Goals />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
EOF

print_status "App.js updated"

# Update Dashboard with new cards
print_info "Updating Dashboard..."
cat > frontend/src/pages/Dashboard.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Upload, Clock, FileText, BarChart3, Target } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalTimeSpent: 0,
    recentFiles: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [filesResponse, progressResponse] = await Promise.all([
        axios.get('http://localhost:3001/api/files'),
        axios.get('http://localhost:3001/api/progress')
      ]);

      const files = filesResponse.data;
      const progressData = progressResponse.data;

      const totalTimeSpent = progressData.reduce((total, progress) => 
        total + (progress.timeSpent || 0), 0
      );

      setStats({
        totalFiles: files.length,
        totalTimeSpent: Math.round(totalTimeSpent / 60),
        recentFiles: files.slice(0, 3)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📚 Local Study Planner</h1>
        <p>Your personal study companion running on Mac Mini M4 - Phase 2</p>
      </header>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <FileText size={32} />
          <div>
            <h3>{stats.totalFiles}</h3>
            <p>PDFs Uploaded</p>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={32} />
          <div>
            <h3>{stats.totalTimeSpent}m</h3>
            <p>Time Studied</p>
          </div>
        </div>
      </div>
      
      <main className="dashboard-main">
        <div className="dashboard-cards">
          <Link to="/files" className="dashboard-card">
            <BookOpen size={48} />
            <h3>My PDFs</h3>
            <p>Manage and organize your study materials</p>
          </Link>
          
          <Link to="/analytics" className="dashboard-card analytics">
            <BarChart3 size={48} />
            <h3>Analytics</h3>
            <p>View reading speed trends and study patterns</p>
          </Link>
          
          <Link to="/goals" className="dashboard-card goals">
            <Target size={48} />
            <h3>Study Goals</h3>
            <p>Set and track your learning objectives</p>
          </Link>
          
          <Link to="/files" className="dashboard-card">
            <Upload size={48} />
            <h3>Upload New PDF</h3>
            <p>Add new study materials</p>
          </Link>
        </div>

        {stats.recentFiles.length > 0 && (
          <div className="recent-files">
            <h2>Recent Files</h2>
            <div className="recent-files-list">
              {stats.recentFiles.map((file) => (
                <Link 
                  key={file.id} 
                  to={`/pdf/${file.id}`} 
                  className="recent-file-item"
                >
                  <FileText size={24} />
                  <div>
                    <h4>{file.name}</h4>
                    <p>{new Date(file.uploadDate).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
EOF

print_status "Dashboard updated"

# Update PDFViewer with timer
print_info "Adding timer to PDF viewer..."
cat > frontend/src/pages/PDFViewer.js << 'EOF'
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Home } from 'lucide-react';
import StudyTimer from '../components/timer/StudyTimer';
import axios from 'axios';

const PDFViewer = () => {
  const { id } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadPDF();
    loadFileInfo();
  }, [id]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [currentPage, scale, rotation, pdfDoc]);

  const loadPDF = async () => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const pdf = await pdfjsLib.getDocument(`http://localhost:3001/pdfs/${id}`).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setLoading(false);

      try {
        const progressResponse = await axios.get(`http://localhost:3001/api/progress/${id}`);
        if (progressResponse.data.currentPage) {
          setCurrentPage(progressResponse.data.currentPage);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  const loadFileInfo = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/files`);
      const file = response.data.find(f => f.id === id);
      setFileInfo(file);
    } catch (error) {
      console.error('Error loading file info:', error);
    }
  };

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      const viewport = page.getViewport({ scale, rotation });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const goToPage = (page) => {
    const newPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(newPage);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  const handleSessionEnd = (sessionData) => {
    console.log('Session ended:', sessionData);
  };

  if (loading) {
    return (
      <div className="pdf-viewer loading">
        <div className="loading-spinner">
          <p>Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <header className="pdf-viewer-header">
        <div className="header-left">
          <Link to="/files" className="back-btn">
            <Home size={20} />
            Back to Files
          </Link>
          <div className="file-title">
            <h1>{fileInfo?.name || 'PDF Viewer'}</h1>
          </div>
        </div>
        
        <div className="pdf-controls">
          <button 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="control-btn"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="page-info">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              min="1"
              max={totalPages}
              className="page-input"
            />
            <span>of {totalPages}</span>
          </div>
          
          <button 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="control-btn"
          >
            <ChevronRight size={20} />
          </button>
          
          <div className="divider"></div>
          
          <button onClick={zoomOut} className="control-btn">
            <ZoomOut size={20} />
          </button>
          
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          
          <button onClick={zoomIn} className="control-btn">
            <ZoomIn size={20} />
          </button>
          
          <button onClick={rotate} className="control-btn">
            <RotateCw size={20} />
          </button>
        </div>
      </header>
      
      <StudyTimer 
        fileId={id}
        currentPage={currentPage}
        onSessionEnd={handleSessionEnd}
      />
      
      <div className="pdf-viewer-content">
        <div className="pdf-container">
          <canvas 
            ref={canvasRef}
            className="pdf-canvas"
          />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
EOF

print_status "PDF Viewer updated with timer"

# Add Phase 2 styles to existing CSS
print_info "Adding Phase 2 styles..."
cat >> frontend/src/styles/App.css << 'EOF'

/* Phase 2 Enhanced Styles */

/* Study Timer Styles */
.study-timer {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

.timer-display svg {
  color: #3498db;
}

.time-text {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 1.4rem;
  color: #2c3e50;
}

.timer-controls {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.timer-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.start-btn {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.start-btn:hover {
  background: linear-gradient(135deg, #27ae60, #229954);
  transform: translateY(-1px);
}

.pause-btn {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.pause-btn:hover {
  background: linear-gradient(135deg, #e67e22, #d35400);
}

.stop-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.stop-btn:hover {
  background: linear-gradient(135deg, #c0392b, #a93226);
}

/* Analytics Dashboard Styles */
.analytics-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.analytics-header {
  text-align: center;
  margin-bottom: 3rem;
}

.analytics-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.analytics-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6c757d;
}

.analytics-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.analytics-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.chart-container {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.chart-container h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  font-weight: 600;
}

/* Goals Manager Styles */
.goals-manager {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.goals-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.goals-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.create-goal-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1rem;
}

.create-goal-btn:hover {
  background: linear-gradient(135deg, #2980b9, #1f5f8b);
  transform: translateY(-2px);
}

.goals-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6c757d;
}

.goals-list {
  display: grid;
  gap: 1.5rem;
}

.no-goals {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

.goal-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.goal-card:hover {
  transform: translateY(-2px);
  border-color: #3498db;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.goal-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.goal-title h3 {
  color: #2c3e50;
  font-size: 1.3rem;
  font-weight: 600;
}

.goal-action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn {
  background: #ffebee;
  color: #c62828;
}

.delete-btn:hover {
  background: #ffcdd2;
}

.goal-description {
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.goal-progress {
  margin-bottom: 1rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  transition: width 0.3s ease;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  width: 90%;
  max-width: 600px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 600;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.cancel-btn {
  padding: 0.75rem 2rem;
  border: 2px solid #e9ecef;
  background: white;
  color: #6c757d;
  border-radius: 8px;
  cursor: pointer;
}

.create-btn {
  padding: 0.75rem 2rem;
  border: none;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Page Navigation */
.page-nav {
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f8f9fa;
  color: #495057;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.nav-link:hover {
  background: #e9ecef;
  color: #2c3e50;
}

/* Enhanced Dashboard Cards */
.dashboard-cards .dashboard-card.analytics {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.dashboard-cards .dashboard-card.goals {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.dashboard-cards .dashboard-card.analytics svg,
.dashboard-cards .dashboard-card.goals svg {
  color: white;
}

.dashboard-cards .dashboard-card.analytics h3,
.dashboard-cards .dashboard-card.goals h3 {
  color: white;
}

.dashboard-cards .dashboard-card.analytics p,
.dashboard-cards .dashboard-card.goals p {
  color: rgba(255, 255, 255, 0.9);
}

/* Responsive Design for Phase 2 */
@media (max-width: 768px) {
  .analytics-charts {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    padding: 1rem;
  }
  
  .analytics-summary {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .goals-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .study-timer {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .timer-controls {
    margin-left: 0;
    justify-content: center;
  }
}
EOF

print_status "Phase 2 styles added"

# Create remaining backend routes that were missing
print_info "Creating remaining backend routes..."

# Create the goals route
cat > backend/src/routes/goals.js << 'EOF'
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const database = require('../database/init');

// Create new goal
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      targetType,
      targetValue,
      startDate,
      endDate,
      fileId,
      topicId
    } = req.body;

    const goalId = uuidv4();
    
    await database.run(
      `INSERT INTO study_goals 
       (id, title, description, target_type, target_value, start_date, end_date, file_id, topic_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [goalId, title, description, targetType, targetValue, startDate, endDate, fileId, topicId]
    );

    res.json({ 
      success: true, 
      goalId,
      message: 'Goal created successfully' 
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Get all goals
router.get('/', async (req, res) => {
  try {
    const goals = await database.query(`
      SELECT g.*, f.original_name as file_name, t.name as topic_name
      FROM study_goals g
      LEFT JOIN files f ON g.file_id = f.id
      LEFT JOIN topics t ON g.topic_id = t.id
      ORDER BY g.created_at DESC
    `);

    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Delete goal
router.delete('/:goalId', async (req, res) => {
  try {
    const { goalId } = req.params;
    
    await database.run('DELETE FROM study_goals WHERE id = ?', [goalId]);
    
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
EOF

# Create topics route
cat > backend/src/routes/topics.js << 'EOF'
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const database = require('../database/init');

// Get all topics
router.get('/', async (req, res) => {
  try {
    const topics = await database.query(`
      SELECT 
        t.*,
        COUNT(f.id) as file_count,
        COALESCE(SUM(rp.total_time_spent), 0) as total_time_spent
      FROM topics t
      LEFT JOIN files f ON t.id = f.topic_id
      LEFT JOIN reading_progress rp ON f.id = rp.file_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Create new topic
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      color = '#3498db',
      targetHoursPerDay = 1.0,
      deadline
    } = req.body;

    const topicId = uuidv4();
    
    await database.run(
      `INSERT INTO topics (id, name, description, color, target_hours_per_day, deadline)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [topicId, name, description, color, targetHoursPerDay, deadline]
    );

    res.json({ 
      success: true, 
      topicId,
      message: 'Topic created successfully' 
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

module.exports = router;
EOF

# Create analytics route
cat > backend/src/routes/analytics.js << 'EOF'
const express = require('express');
const router = express.Router();
const database = require('../database/init');

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Today's stats
    const todayStats = await database.query(
      'SELECT * FROM daily_stats WHERE date = ?',
      [today]
    );
    
    // Week's stats
    const weekStats = await database.query(
      'SELECT SUM(total_reading_time) as total_time, SUM(pages_read) as total_pages FROM daily_stats WHERE date >= ?',
      [weekAgo]
    );
    
    // Total files and average reading speed
    const totalFiles = await database.query('SELECT COUNT(*) as count FROM files');
    const avgSpeed = await database.query(
      'SELECT AVG(average_reading_speed) as avg_speed FROM reading_progress WHERE average_reading_speed > 0'
    );
    
    // Active goals
    const activeGoals = await database.query(
      'SELECT COUNT(*) as count FROM study_goals WHERE is_completed = FALSE'
    );

    res.json({
      today: {
        readingTime: todayStats.length > 0 ? todayStats[0].total_reading_time : 0,
        pagesRead: todayStats.length > 0 ? todayStats[0].pages_read : 0,
        sessions: todayStats.length > 0 ? todayStats[0].sessions_count : 0
      },
      week: {
        totalTime: weekStats.length > 0 ? weekStats[0].total_time || 0 : 0,
        totalPages: weekStats.length > 0 ? weekStats[0].total_pages || 0 : 0
      },
      overall: {
        totalFiles: totalFiles[0].count,
        averageSpeed: avgSpeed.length > 0 ? avgSpeed[0].avg_speed || 0 : 0,
        activeGoals: activeGoals[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get reading speed trends
router.get('/reading-speed', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const speedData = await database.query(`
      SELECT 
        DATE(s.start_time) as date,
        AVG(s.reading_speed) as avg_speed,
        COUNT(*) as sessions_count,
        SUM(s.pages_read) as total_pages
      FROM reading_sessions s
      WHERE DATE(s.start_time) >= ? AND s.reading_speed > 0
      GROUP BY DATE(s.start_time)
      ORDER BY date ASC
    `, [daysAgo]);

    res.json(speedData);
  } catch (error) {
    console.error('Error fetching reading speed data:', error);
    res.status(500).json({ error: 'Failed to fetch reading speed data' });
  }
});

// Get daily activity chart data
router.get('/daily-activity', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const activityData = await database.query(`
      SELECT 
        date,
        total_reading_time as readingTime,
        pages_read as pagesRead,
        sessions_count as sessions
      FROM daily_stats
      WHERE date >= ?
      ORDER BY date ASC
    `, [startDate]);

    res.json(activityData);
  } catch (error) {
    console.error('Error fetching daily activity:', error);
    res.status(500).json({ error: 'Failed to fetch daily activity data' });
  }
});

// Get topic distribution
router.get('/topics-distribution', async (req, res) => {
  try {
    const topicData = await database.query(`
      SELECT 
        t.name,
        t.color,
        COUNT(f.id) as file_count,
        COALESCE(SUM(rp.total_time_spent), 0) as total_time
      FROM topics t
      LEFT JOIN files f ON t.id = f.topic_id
      LEFT JOIN reading_progress rp ON f.id = rp.file_id
      GROUP BY t.id, t.name, t.color
      ORDER BY total_time DESC
    `);

    res.json(topicData);
  } catch (error) {
    console.error('Error fetching topic distribution:', error);
    res.status(500).json({ error: 'Failed to fetch topic distribution' });
  }
});

module.exports = router;
EOF

print_status "All backend routes created"

print_info "Installing frontend dependencies..."
cd frontend
npm install
cd ..

print_status "Phase 2 frontend setup complete!"
echo ""
print_info "🎉 All Phase 2 components have been created!"
echo ""
print_info "📋 What's been added:"
echo "   📊 Analytics Dashboard with charts"
echo "   🎯 Goals Manager with progress tracking"
echo "   ⏱️  Study Timer in PDF viewer"
echo "   🔄 Enhanced API services"
echo "   🎨 Complete styling system"
echo "   📱 Responsive design"
echo ""
print_info "🚀 Your Phase 2 setup is now complete!"
echo ""
print_info "🎯 Next step: Start your enhanced study planner"
echo "   ./scripts/start-phase2.sh"
echo ""
print_info "🌐 Once running, access:"
echo "   Main Dashboard: http://localhost:3000"
echo "   Analytics: http://localhost:3000/analytics"  
echo "   Goals: http://localhost:3000/goals"
echo ""
print_status "Ready to enhance your study experience! 📚✨"