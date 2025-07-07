-- Phase 2 Focused Schema: Time Tracking and Goal Setting
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    total_pages INTEGER,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    deadline DATE,
    estimated_reading_time INTEGER, -- in minutes, calculated from reading speed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reading_sessions (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INTEGER, -- in seconds
    pages_read INTEGER DEFAULT 0,
    start_page INTEGER,
    end_page INTEGER,
    reading_speed REAL, -- pages per minute
    session_type TEXT DEFAULT 'reading',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files (id)
);

CREATE TABLE IF NOT EXISTS reading_progress (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    current_page INTEGER DEFAULT 1,
    total_time_spent INTEGER DEFAULT 0, -- in seconds
    sessions_count INTEGER DEFAULT 0,
    average_reading_speed REAL, -- pages per minute
    estimated_completion_time INTEGER, -- in minutes, Phase 2 key feature
    last_session_date DATETIME,
    completion_percentage REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files (id)
);

CREATE TABLE IF NOT EXISTS study_goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    target_type TEXT NOT NULL CHECK (target_type IN ('daily_minutes', 'completion_date')), -- Phase 2 focus
    target_value REAL NOT NULL,
    current_progress REAL DEFAULT 0.0,
    start_date DATE NOT NULL,
    end_date DATE, -- deadline for Phase 2
    file_id TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files (id)
);

CREATE TABLE IF NOT EXISTS daily_stats (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    total_reading_time INTEGER DEFAULT 0, -- in seconds
    pages_read INTEGER DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    files_worked_on INTEGER DEFAULT 0,
    average_reading_speed REAL,
    goals_met INTEGER DEFAULT 0, -- Phase 2: track daily goal achievement
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Phase 2 performance
CREATE INDEX IF NOT EXISTS idx_reading_sessions_file_id ON reading_sessions (file_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_start_time ON reading_sessions (start_time);
CREATE INDEX IF NOT EXISTS idx_reading_progress_file_id ON reading_progress (file_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats (date);
CREATE INDEX IF NOT EXISTS idx_study_goals_file_id ON study_goals (file_id);
CREATE INDEX IF NOT EXISTS idx_study_goals_end_date ON study_goals (end_date); -- For deadline tracking
