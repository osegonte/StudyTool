const express = require('express');
const router = express.Router();

// Get intelligent dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Mock data structure - in real implementation, this would come from database
    const mockData = {
      today: {
        readingTime: 0,
        pagesRead: 0,
        sessions: 0,
        goalsMet: 0,
        focusScore: 0 // New metric: quality of attention
      },
      week: {
        totalTime: 0,
        totalPages: 0,
        avgSessionLength: 0,
        consistencyScore: 0
      },
      overall: {
        totalFiles: 0,
        averageSpeed: 0,
        activeGoals: 0,
        goalsDueSoon: 0,
        totalStudyDays: 0,
        longestStreak: 0
      },
      predictions: {
        estimatedFinishTimes: {},
        recommendedDailyTime: 30,
        riskAssessment: 'low', // low, medium, high
        adaptiveInsights: []
      }
    };

    res.json(mockData);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get reading speed intelligence
router.get('/reading-speed', async (req, res) => {
  try {
    const { period = '30', fileId } = req.query;
    
    // Mock speed data with intelligence insights
    const mockSpeedData = [];
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      mockSpeedData.push({
        date: date.toISOString().split('T')[0],
        avg_speed: Math.random() * 2 + 0.5, // 0.5-2.5 pages per minute
        sessions_count: Math.floor(Math.random() * 3) + 1,
        total_pages: Math.floor(Math.random() * 10) + 5,
        focus_quality: Math.random() * 100, // Focus quality score
        difficulty_estimate: Math.random() // Content difficulty estimation
      });
    }
    
    res.json(mockSpeedData);
  } catch (error) {
    console.error('Error fetching reading speed data:', error);
    res.status(500).json({ error: 'Failed to fetch reading speed data' });
  }
});

// Get daily activity with productivity insights
router.get('/daily-activity', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    
    const mockActivityData = [];
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      mockActivityData.push({
        date: date.toISOString().split('T')[0],
        readingTime: Math.floor(Math.random() * 120) * 60, // 0-120 minutes in seconds
        pagesRead: Math.floor(Math.random() * 20),
        sessions: Math.floor(Math.random() * 4) + 1,
        goalsMet: Math.random() > 0.3 ? 1 : 0,
        productivityScore: Math.random() * 100,
        optimalTime: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)]
      });
    }

    res.json(mockActivityData);
  } catch (error) {
    console.error('Error fetching daily activity:', error);
    res.status(500).json({ error: 'Failed to fetch daily activity data' });
  }
});

// Get time estimation accuracy and learning insights
router.get('/time-intelligence', async (req, res) => {
  try {
    const intelligence = {
      estimationAccuracy: {
        overallAccuracy: 78, // Percentage
        improvementTrend: 'improving', // improving, stable, declining
        accuracyByContent: {
          'technical': 65,
          'narrative': 85,
          'academic': 72
        }
      },
      
      learningInsights: {
        peakPerformanceTime: '14:00-16:00',
        optimalSessionLength: 35, // minutes
        idealBreakInterval: 25, // minutes
        concentrationScore: 82,
        fatiguePattern: 'late_afternoon'
      },
      
      adaptiveRecommendations: [
        {
          type: 'timing',
          message: 'Your reading speed is 23% higher in afternoon sessions',
          action: 'Schedule challenging content between 2-4 PM'
        },
        {
          type: 'pacing',
          message: 'Sessions longer than 45 minutes show decreased efficiency',
          action: 'Consider 35-minute focused sessions with breaks'
        },
        {
          type: 'difficulty',
          message: 'Technical content takes 40% longer than estimated',
          action: 'Adjust time estimates for technical PDFs'
        }
      ],
      
      progressForecasting: {
        currentTrend: 'on_track', // ahead, on_track, behind
        completionProbability: 89, // Percentage chance of meeting deadlines
        riskFactors: ['upcoming_exam_period'],
        adjustmentSuggestions: [
          'Increase daily reading time by 15 minutes',
          'Focus on key chapters first'
        ]
      }
    };

    res.json(intelligence);
  } catch (error) {
    console.error('Error fetching time intelligence:', error);
    res.status(500).json({ error: 'Failed to fetch time intelligence data' });
  }
});

// Get study pattern analysis
router.get('/study-patterns', async (req, res) => {
  try {
    const patterns = {
      timeOfDay: {
        morning: { sessions: 12, avgSpeed: 1.8, focusScore: 85 },
        afternoon: { sessions: 18, avgSpeed: 2.1, focusScore: 92 },
        evening: { sessions: 15, avgSpeed: 1.5, focusScore: 78 }
      },
      
      dayOfWeek: {
        weekdays: { avgTime: 45, consistency: 88 },
        weekends: { avgTime: 72, consistency: 65 }
      },
      
      sessionLength: {
        optimal: 35, // minutes
        current: 42,
        efficiency: {
          '0-20': 78,
          '21-40': 95,
          '41-60': 87,
          '60+': 72
        }
      },
      
      contentType: {
        technical: { speed: 1.2, difficulty: 8, retention: 85 },
        academic: { speed: 1.6, difficulty: 6, retention: 78 },
        general: { speed: 2.2, difficulty: 4, retention: 82 }
      }
    };

    res.json(patterns);
  } catch (error) {
    console.error('Error fetching study patterns:', error);
    res.status(500).json({ error: 'Failed to fetch study patterns' });
  }
});

module.exports = router;
