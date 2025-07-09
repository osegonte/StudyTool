import React, { useState, useEffect } from 'react';
import { 
  User, Settings, Palette, Download, Trash2, 
  Moon, Sun, Monitor, Save, Bell, Clock, Target
} from 'lucide-react';
import api from '../../services/api';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    profile: {
      name: 'Victor',
      email: 'victor@example.com',
      avatar: null
    },
    study: {
      dailyGoal: 60,
      pomodoroWork: 25,
      pomodoroBreak: 5,
      focusMode: true,
      notifications: true,
      autoSave: true
    },
    appearance: {
      theme: 'system',
      compactMode: false,
      animations: true
    }
  });
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'study', label: 'Study Preferences', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Export & Privacy', icon: Download }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/user-progress/stats');
      setSettings(prev => ({
        ...prev,
        study: {
          ...prev.study,
          dailyGoal: response.data.daily_goal || 60
        }
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/user-progress/settings/daily_study_goal_minutes', {
        value: settings.study.dailyGoal.toString()
      });
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'settings-toast success';
      toast.textContent = 'Settings saved successfully';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const exportData = async () => {
    try {
      const response = await api.get('/data/export');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_data_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const TabContent = ({ tab }) => {
    switch (tab) {
      case 'profile':
        return (
          <div className="settings-content">
            <div className="settings-group">
              <h3>Personal Information</h3>
              
              <div className="avatar-section">
                <div className="avatar-preview">
                  <div className="avatar-circle">
                    <User size={32} />
                  </div>
                </div>
                <div className="avatar-controls">
                  <button className="btn-secondary">Choose Photo</button>
                  <button className="btn-secondary">Remove</button>
                </div>
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={settings.profile.name}
                  onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>
        );

      case 'study':
        return (
          <div className="settings-content">
            <div className="settings-group">
              <h3>Study Goals</h3>
              
              <div className="form-group">
                <label>Daily Study Goal</label>
                <div className="slider-input">
                  <input
                    type="range"
                    min="15"
                    max="480"
                    step="15"
                    value={settings.study.dailyGoal}
                    onChange={(e) => updateSetting('study', 'dailyGoal', parseInt(e.target.value))}
                    className="slider"
                  />
                  <div className="slider-value">
                    <Clock size={16} />
                    <span>{settings.study.dailyGoal} minutes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h3>Pomodoro Timer</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Work Duration</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={settings.study.pomodoroWork}
                      onChange={(e) => updateSetting('study', 'pomodoroWork', parseInt(e.target.value))}
                      min="5"
                      max="60"
                    />
                    <span>min</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Break Duration</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      value={settings.study.pomodoroBreak}
                      onChange={(e) => updateSetting('study', 'pomodoroBreak', parseInt(e.target.value))}
                      min="5"
                      max="30"
                    />
                    <span>min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h3>Study Features</h3>
              
              <div className="toggle-group">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <label>Focus Mode</label>
                    <p>Hide distractions during study sessions</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.study.focusMode}
                      onChange={(e) => updateSetting('study', 'focusMode', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <label>Notifications</label>
                    <p>Get reminders and progress updates</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.study.notifications}
                      onChange={(e) => updateSetting('study', 'notifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <label>Auto-save Progress</label>
                    <p>Automatically save your reading progress</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.study.autoSave}
                      onChange={(e) => updateSetting('study', 'autoSave', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-content">
            <div className="settings-group">
              <h3>Theme</h3>
              
              <div className="theme-options">
                <div 
                  className={`theme-option ${settings.appearance.theme === 'light' ? 'active' : ''}`}
                  onClick={() => updateSetting('appearance', 'theme', 'light')}
                >
                  <Sun size={24} />
                  <span>Light</span>
                </div>
                
                <div 
                  className={`theme-option ${settings.appearance.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => updateSetting('appearance', 'theme', 'dark')}
                >
                  <Moon size={24} />
                  <span>Dark</span>
                </div>
                
                <div 
                  className={`theme-option ${settings.appearance.theme === 'system' ? 'active' : ''}`}
                  onClick={() => updateSetting('appearance', 'theme', 'system')}
                >
                  <Monitor size={24} />
                  <span>System</span>
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h3>Interface</h3>
              
              <div className="toggle-group">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <label>Compact Mode</label>
                    <p>Use smaller spacing and controls</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.appearance.compactMode}
                      onChange={(e) => updateSetting('appearance', 'compactMode', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <label>Animations</label>
                    <p>Enable smooth transitions and effects</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.appearance.animations}
                      onChange={(e) => updateSetting('appearance', 'animations', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="settings-content">
            <div className="settings-group">
              <h3>Data Export</h3>
              <p>Download all your study data for backup or transfer</p>
              
              <button className="btn-primary" onClick={exportData}>
                <Download size={16} />
                Download Data
              </button>
            </div>

            <div className="settings-group danger-zone">
              <h3>Danger Zone</h3>
              <p>Permanently delete your account and all data</p>
              
              <button className="btn-danger">
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Customize your study experience</p>
      </div>

      <div className="settings-container">
        {/* macOS-style Tab Navigation */}
        <div className="settings-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="settings-panel">
          <TabContent tab={activeTab} />
          
          <div className="settings-footer">
            <button 
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
