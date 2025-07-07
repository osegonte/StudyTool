const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Enhanced session storage with page-level data
let sessions = {};
let sessionAnalytics = {};

// Start a new study session
router.post('/start', async (req, res) => {
  try {
    const { fileId, startPage, totalPages } = req.body;
    const sessionId = uuidv4();
    
    const session = {
      id: sessionId,
      fileId: fileId,
      startTime: new Date().toISOString(),
      startPage: startPage || 1,
      totalPages: totalPages || 100,
      sessionType: 'reading',
      isActive: true,
      pageTimeData: {},
      milestones: []
    };

    sessions[sessionId] = session;
    
    // Initialize session analytics
    if (!sessionAnalytics[fileId]) {
      sessionAnalytics[fileId] = {
        totalSessions: 0,
        totalTime: 0,
        totalPages: 0,
        averageSpeed: 0,
        sessionHistory: []
      };
    }

    res.json({ 
      success: true, 
      sessionId: sessionId,
      message: 'Study session started with page-level tracking' 
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// End study session with comprehensive data
router.post('/end/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { endPage, sessionDuration, pagesRead, pageTimeData } = req.body;
    
    if (!sessions[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessions[sessionId];
    const endTime = new Date().toISOString();
    
    // Calculate comprehensive session metrics
    const actualDuration = sessionDuration || Math.floor((new Date(endTime) - new Date(session.startTime)) / 1000);
    const actualPagesRead = pagesRead || Math.max(1, (endPage || session.startPage) - session.startPage + 1);
    const readingSpeed = actualPagesRead / (actualDuration / 60); // pages per minute
    const avgTimePerPage = actualDuration / actualPagesRead; // seconds per page
    
    // Update session
    session.endTime = endTime;
    session.duration = actualDuration;
    session.endPage = endPage;
    session.pagesRead = actualPagesRead;
    session.readingSpeed = readingSpeed;
    session.avgTimePerPage = avgTimePerPage;
    session.pageTimeData = pageTimeData || {};
    session.isActive = false;
    
    // Update analytics for this file
    const analytics = sessionAnalytics[session.fileId];
    analytics.totalSessions += 1;
    analytics.totalTime += actualDuration;
    analytics.totalPages += actualPagesRead;
    analytics.averageSpeed = analytics.totalPages / (analytics.totalTime / 60);
    
    // Add to session history
    analytics.sessionHistory.push({
      sessionId: sessionId,
      date: endTime.split('T')[0],
      duration: actualDuration,
      pagesRead: actualPagesRead,
      readingSpeed: readingSpeed,
      startPage: session.startPage,
      endPage: endPage
    });
    
    // Calculate estimated finish time for remaining pages
    const remainingPages = session.totalPages - (endPage || session.startPage);
    const estimatedFinishTime = Math.ceil(remainingPages * avgTimePerPage / 60); // minutes
    
    // Determine reading difficulty based on speed
    let difficulty = 'Normal';
    if (readingSpeed < 0.5) difficulty = 'Challenging';
    else if (readingSpeed > 2) difficulty = 'Easy';
    
    res.json({ 
      success: true, 
      sessionData: {
        duration: actualDuration,
        pagesRead: actualPagesRead,
        readingSpeed: readingSpeed,
        avgTimePerPage: avgTimePerPage,
        estimatedFinishTime: estimatedFinishTime,
        difficulty: difficulty,
        progress: Math.round(((endPage || session.startPage) / session.totalPages) * 100)
      },
      analytics: {
        totalSessions: analytics.totalSessions,
        averageSpeed: analytics.averageSpeed,
        totalStudyTime: analytics.totalTime
      },
      message: 'Session completed with detailed analytics' 
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get session analytics for a file
router.get('/analytics/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!sessionAnalytics[fileId]) {
      return res.json({
        totalSessions: 0,
        totalTime: 0,
        totalPages: 0,
        averageSpeed: 0,
        sessionHistory: [],
        predictions: {
          estimatedFinishTime: 0,
          recommendedDailyTime: 0
        }
      });
    }
    
    const analytics = sessionAnalytics[fileId];
    
    // Calculate predictions based on collected data
    const predictions = {
      estimatedFinishTime: 0,
      recommendedDailyTime: 30, // Default 30 minutes
      consistencyScore: 0
    };
    
    if (analytics.sessionHistory.length > 0) {
      // Calculate consistency (how regular are study sessions)
      const dates = [...new Set(analytics.sessionHistory.map(s => s.date))];
      predictions.consistencyScore = Math.min(100, (dates.length / 7) * 100); // Based on weekly consistency
      
      // Recommend daily time based on average session length
      const avgSessionLength = analytics.totalTime / analytics.totalSessions;
      predictions.recommendedDailyTime = Math.max(15, Math.min(90, avgSessionLength));
    }
    
    res.json({
      ...analytics,
      predictions: predictions
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch session analytics' });
  }
});

// Get session history for a file
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileSessions = Object.values(sessions).filter(s => s.fileId === fileId);
    res.json(fileSessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get all sessions for dashboard
router.get('/all', async (req, res) => {
  try {
    const allSessions = Object.values(sessions);
    const summary = {
      totalSessions: allSessions.length,
      activeSessions: allSessions.filter(s => s.isActive).length,
      totalStudyTime: allSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      totalPagesRead: allSessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0)
    };
    
    res.json({
      sessions: allSessions,
      summary: summary
    });
  } catch (error) {
    console.error('Error fetching all sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get reading speed trends over time
router.get('/speed-trends/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!sessionAnalytics[fileId]) {
      return res.json([]);
    }
    
    const trends = sessionAnalytics[fileId].sessionHistory.map(session => ({
      date: session.date,
      readingSpeed: session.readingSpeed,
      duration: session.duration,
      pagesRead: session.pagesRead
    }));
    
    res.json(trends);
  } catch (error) {
    console.error('Error fetching speed trends:', error);
    res.status(500).json({ error: 'Failed to fetch speed trends' });
  }
});

module.exports = router;
