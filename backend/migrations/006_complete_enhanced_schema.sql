-- Complete Enhanced Database Schema for Study Planner

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Achievements system
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_key VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    unlock_condition JSONB DEFAULT '{}'::jsonb,
    is_secret BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements tracking
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    xp_awarded INTEGER DEFAULT 0
);

-- Daily recommendations
CREATE TABLE IF NOT EXISTS daily_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommendation_type VARCHAR(50) DEFAULT 'general',
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    estimated_minutes INTEGER DEFAULT 30,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study milestones
CREATE TABLE IF NOT EXISTS study_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_key VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    celebration_message TEXT NOT NULL,
    trigger_condition JSONB DEFAULT '{}'::jsonb,
    xp_bonus INTEGER DEFAULT 0,
    icon VARCHAR(10) DEFAULT '🎯',
    last_triggered TIMESTAMP,
    times_triggered INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notes system
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general',
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note links (bidirectional)
CREATE TABLE IF NOT EXISTS note_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    link_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_note_id, target_note_id)
);

-- PDF anchors for notes
CREATE TABLE IF NOT EXISTS note_pdf_anchors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    anchor_text TEXT,
    position_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_daily_recommendations_date ON daily_recommendations(date);
CREATE INDEX IF NOT EXISTS idx_notes_topic ON notes(topic_id);
CREATE INDEX IF NOT EXISTS idx_notes_file ON notes(file_id);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_note_id);
CREATE INDEX IF NOT EXISTS idx_note_pdf_anchors_note ON note_pdf_anchors(note_id);
CREATE INDEX IF NOT EXISTS idx_note_pdf_anchors_file_page ON note_pdf_anchors(file_id, page_number);

-- Update triggers for notes
CREATE OR REPLACE FUNCTION update_note_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_note_timestamp ON notes;
CREATE TRIGGER trigger_update_note_timestamp
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_note_timestamp();

COMMENT ON TABLE achievements IS 'Achievement badges and rewards system';
COMMENT ON TABLE user_achievements IS 'User unlocked achievements tracking';
COMMENT ON TABLE daily_recommendations IS 'AI-generated daily study recommendations';
COMMENT ON TABLE study_milestones IS 'Major study milestones with celebrations';
COMMENT ON TABLE notes IS 'Smart notes with linking and tagging';
COMMENT ON TABLE note_links IS 'Bidirectional links between notes';
COMMENT ON TABLE note_pdf_anchors IS 'Anchors linking notes to specific PDF locations';
