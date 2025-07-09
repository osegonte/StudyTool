-- Stage 5: Comprehensive Note-Taking System
-- Obsidian-style notes with bidirectional linking and PDF integration

-- Notes table - Core note storage
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT false,
    note_type VARCHAR(50) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0
);

-- Note links table - Bidirectional linking between notes
CREATE TABLE IF NOT EXISTS note_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    link_type VARCHAR(50) DEFAULT 'reference',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_note_id, target_note_id)
);

-- Note attachments
CREATE TABLE IF NOT EXISTS note_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PDF note anchors
CREATE TABLE IF NOT EXISTS pdf_note_anchors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    anchor_text TEXT,
    position_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note templates
CREATE TABLE IF NOT EXISTS note_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_content TEXT NOT NULL,
    template_type VARCHAR(50) DEFAULT 'general',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_topic_id ON notes(topic_id);
CREATE INDEX IF NOT EXISTS idx_notes_file_id ON notes(file_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_note_links_source ON note_links(source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON note_links(target_note_id);
CREATE INDEX IF NOT EXISTS idx_pdf_anchors_file_page ON pdf_note_anchors(file_id, page_number);

-- Insert default note templates
INSERT INTO note_templates (template_name, template_content, template_type, is_default) VALUES
('Basic Note', '# {{title}}

## Key Points
- 

## Summary


## Questions
- 

## Related Topics
- [[]]

---
*Created: {{date}}*', 'general', true),

('Concept Summary', '# {{title}}

## Definition
{{definition}}

## Key Characteristics
- 

## Examples
1. 

## Related Concepts
- [[]]

## Study Notes
{{notes}}

---
*Topic: {{topic}} | Source: {{source}}*', 'summary', false)

ON CONFLICT (template_name) DO NOTHING;

-- Function to automatically update note metadata
CREATE OR REPLACE FUNCTION update_note_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update word and character counts
    NEW.word_count = array_length(string_to_array(NEW.content, ' '), 1);
    NEW.character_count = char_length(NEW.content);
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for note metadata updates
DROP TRIGGER IF EXISTS trigger_update_note_metadata ON notes;
CREATE TRIGGER trigger_update_note_metadata
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_note_metadata();

COMMENT ON TABLE notes IS 'Core note storage with Obsidian-style features';
COMMENT ON TABLE note_links IS 'Bidirectional linking between notes for knowledge graphs';
COMMENT ON TABLE pdf_note_anchors IS 'Link notes to specific PDF pages and positions';
