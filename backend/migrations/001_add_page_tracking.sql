-- Page-level time tracking tables for Phase 2 Stage 1

-- Track individual page view sessions
CREATE TABLE IF NOT EXISTS page_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_page_tracking_file_page ON page_tracking(file_id, page_number);
CREATE INDEX IF NOT EXISTS idx_page_tracking_session ON page_tracking(session_start, session_end);

-- Add page tracking columns to existing reading_progress table
ALTER TABLE reading_progress 
ADD COLUMN IF NOT EXISTS current_page_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS total_reading_time_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pages_read_count INTEGER DEFAULT 0;

-- Update triggers to automatically calculate reading statistics
CREATE OR REPLACE FUNCTION update_reading_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total reading time and pages read count
    UPDATE reading_progress 
    SET 
        total_reading_time_seconds = (
            SELECT COALESCE(SUM(time_spent_seconds), 0) 
            FROM page_tracking 
            WHERE file_id = NEW.file_id
        ),
        pages_read_count = (
            SELECT COUNT(DISTINCT page_number) 
            FROM page_tracking 
            WHERE file_id = NEW.file_id AND time_spent_seconds > 5
        ),
        last_read = CURRENT_TIMESTAMP
    WHERE file_id = NEW.file_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when page tracking is updated
DROP TRIGGER IF EXISTS trigger_update_reading_stats ON page_tracking;
CREATE TRIGGER trigger_update_reading_stats
    AFTER INSERT OR UPDATE ON page_tracking
    FOR EACH ROW EXECUTE FUNCTION update_reading_stats();

COMMENT ON TABLE page_tracking IS 'Tracks time spent on individual pages during reading sessions';
COMMENT ON COLUMN page_tracking.time_spent_seconds IS 'Time spent on this page in seconds';
COMMENT ON COLUMN reading_progress.total_reading_time_seconds IS 'Total time spent reading this file across all sessions';
