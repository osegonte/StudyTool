// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Styles
import './styles/sprintstudy.css';
import './styles/pdf-viewer.css';

// Core Layout Components
import AppleNavigation from './components/apple/AppleNavigation';
import AppleDashboard from './components/apple/AppleDashboard';

// Main Feature Components
import DocumentManager from './components/DocumentManager';
import TopicManager from './components/TopicManager';
import SettingsPage from './components/SettingsPage';

// Advanced Components
import AdvancedPDFViewer from './components/viewer/AdvancedPDFViewer';
import RealTimeDashboard from './components/analytics/RealTimeDashboard';

// Services
import api from './services/api';
import { NotificationProvider } from './services/notifications';

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="error-boundary">
    <div className="error-content">
      <h2>⚠️ Something went wrong</h2>
      <details style={{ whiteSpace: 'pre-wrap', marginBottom: '20px' }}>
        <summary>Error details</summary>
        {error.message}
      </details>
      <div className="error-actions">
        <button onClick={resetErrorBoundary} className="btn-primary">
          Try again
        </button>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          Reload page
        </button>
      </div>
    </div>
  </div>
);

// Loading Component
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-content">
      <div className="loading-spinner large"></div>
      <h2>SprintStudy</h2>
      <p>Initializing your study environment...</p>
    </div>
  </div>
);

// Coming Soon Placeholder Component
const ComingSoonPage = ({ title, description, phase, icon }) => (
  <div className="main-content">
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="greeting-text">{icon} {title}</h1>
        <p className="greeting-subtitle">{description}</p>
      </div>
      <div className="stat-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>{icon}</div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
          {title} Coming Soon
        </h3>
        <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
          {description}
        </p>
        <div className="btn btn-primary">🚀 Available in {phase}</div>
      </div>
    </div>
  </div>
);

// Individual page components for future features
const SprintPage = () => (
  <ComingSoonPage 
    title="Study Sprints" 
    description="Transform long documents into focused, manageable study sessions"
    phase="Phase 2"
    icon="⏱️"
  />
);

const NotesPage = () => (
  <ComingSoonPage 
    title="Smart Notes" 
    description="Intelligent note-taking with bidirectional linking"
    phase="Phase 3"
    icon="📝"
  />
);

const GoalsPage = () => (
  <ComingSoonPage 
    title="Goals & Achievements" 
    description="Set study targets and track your progress"
    phase="Phase 3"
    icon="🎯"
  />
);

// Main App Component
function App() {
  // Application state
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [userSettings, setUserSettings] = useState({
    theme: 'light',
    notifications: true,
    autoSave: true
  });

  // Initialize application
  useEffect(() => {
    initializeApp();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializeApp, setupEventListeners]);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing SprintStudy...');
      
      // Check backend connection
      await checkBackendHealth();
      
      // Load user settings
      await loadUserSettings();
      
      // Apply theme
      applyTheme(userSettings.theme);
      
      // Setup service worker for offline support
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
          console.log('✅ Service Worker registered');
        } catch (error) {
          console.log('Service Worker registration failed:', error);
        }
      }
      
      console.log('✅ SprintStudy initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize SprintStudy:', error);
      setBackendStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkBackendHealth = async () => {
    try {
      const response = await api.get('/health');
      if (response.data.status === 'healthy') {
        setBackendStatus('connected');
        console.log('✅ Backend connection established');
      } else {
        throw new Error('Backend unhealthy');
      }
    } catch (error) {
      setBackendStatus('disconnected');
      console.error('❌ Backend connection failed:', error);
      // Continue anyway for offline functionality
    }
  };

  const loadUserSettings = async () => {
    try {
      const response = await api.get('/user-settings');
      const settings = response.data.settings || {};
      
      setUserSettings({
        theme: settings.theme || 'light',
        notifications: settings.notifications !== false,
        autoSave: settings.autoSave !== false,
        ...settings
      });
    } catch (error) {
      console.log('Using default user settings');
      // Use defaults if API call fails
    }
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', 
        theme === 'dark' ? '#1f2937' : '#ffffff'
      );
    }
  };

  const setupEventListeners = () => {
    // Online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      checkBackendHealth();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setBackendStatus('offline');
    };

    // Keyboard shortcuts
    const handleGlobalKeyboard = (event) => {
      // Global app shortcuts
      if (event.metaKey || event.ctrlKey) {
        switch (event.key) {
          case ',':
            event.preventDefault();
            window.location.hash = '/settings';
            break;
          case '/':
            event.preventDefault();
            // Focus search if available
            const searchInput = document.querySelector('.search-input');
            if (searchInput) searchInput.focus();
            break;
          default:
            break;
        }
      }
    };

    // Prevent accidental page refresh during study sessions
    const handleBeforeUnload = (event) => {
      const hasActiveSession = document.querySelector('.session-active');
      if (hasActiveSession) {
        event.preventDefault();
        event.returnValue = 'You have an active study session. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('keydown', handleGlobalKeyboard);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Store cleanup functions
    window.sprintStudyCleanup = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleGlobalKeyboard);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  };

  const cleanupEventListeners = () => {
    if (window.sprintStudyCleanup) {
      window.sprintStudyCleanup();
    }
  };

  // Update settings function
  const updateUserSettings = async (newSettings) => {
    const updatedSettings = { ...userSettings, ...newSettings };
    setUserSettings(updatedSettings);
    
    // Apply theme change immediately
    if (newSettings.theme) {
      applyTheme(newSettings.theme);
    }
    
    // Save to backend
    try {
      await api.put('/user-settings', updatedSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Show loading screen during initialization
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <NotificationProvider enabled={userSettings.notifications}>
        <Router>
          <div className="App" data-theme={userSettings.theme}>
            {/* Connection Status Bar */}
            {!isOnline && (
              <div className="status-bar offline">
                <span>📡 Offline Mode - Some features may be limited</span>
              </div>
            )}
            
            {backendStatus === 'disconnected' && isOnline && (
              <div className="status-bar warning">
                <span>⚠️ Backend disconnected - Retrying connection...</span>
              </div>
            )}

            {/* Main Application Layout */}
            <div className="app-layout">
              {/* Sidebar Navigation */}
              <AppleNavigation 
                userSettings={userSettings}
                backendStatus={backendStatus}
                isOnline={isOnline}
              />

              {/* Main Content Area */}
              <main className="main-content-wrapper">
                <Routes>
                  {/* Dashboard Routes */}
                  <Route 
                    path="/" 
                    element={
                      <AppleDashboard 
                        userSettings={userSettings}
                        backendStatus={backendStatus}
                      />
                    } 
                  />
                  
                  {/* Core Features */}
                  <Route 
                    path="/files" 
                    element={
                      <DocumentManager 
                        userSettings={userSettings}
                      />
                    } 
                  />
                  
                  <Route 
                    path="/topics" 
                    element={
                      <TopicManager 
                        userSettings={userSettings}
                      />
                    } 
                  />
                  
                  {/* PDF Viewer */}
                  <Route 
                    path="/viewer/:fileId" 
                    element={
                      <AdvancedPDFViewer 
                        userSettings={userSettings}
                        backendStatus={backendStatus}
                      />
                    } 
                  />
                  
                  {/* Analytics */}
                  <Route 
                    path="/analytics" 
                    element={
                      <RealTimeDashboard 
                        userSettings={userSettings}
                        backendStatus={backendStatus}
                      />
                    } 
                  />
                  
                  {/* Settings */}
                  <Route 
                    path="/settings" 
                    element={
                      <SettingsPage 
                        userSettings={userSettings}
                        onUpdateSettings={updateUserSettings}
                        backendStatus={backendStatus}
                      />
                    } 
                  />
                  
                  {/* Future Features - Coming Soon Pages */}
                  <Route path="/sprints" element={<SprintPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/notes/*" element={<NotesPage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  
                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>

            {/* Global Notifications Portal */}
            <div id="notifications-portal"></div>
            
            {/* Keyboard Shortcuts Help (Hidden by default) */}
            <div className="shortcuts-help" id="shortcuts-help" style={{ display: 'none' }}>
              <div className="shortcuts-content">
                <h3>⌨️ Keyboard Shortcuts</h3>
                <div className="shortcuts-list">
                  <div className="shortcut-item">
                    <kbd>Cmd/Ctrl</kbd> + <kbd>,</kbd>
                    <span>Open Settings</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Cmd/Ctrl</kbd> + <kbd>/</kbd>
                    <span>Focus Search</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>Space</kbd>
                    <span>Start/Pause Timer</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>←</kbd> / <kbd>→</kbd>
                    <span>Navigate Pages</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>B</kbd>
                    <span>Bookmark Page</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>N</kbd>
                    <span>Toggle Notes</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>F</kbd>
                    <span>Fit to Width</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd>+</kbd> / <kbd>-</kbd>
                    <span>Zoom In/Out</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;