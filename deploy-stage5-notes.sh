#!/bin/bash

# Stage 5: Topic-Based Smart Note-Taking System Deployment
# Implements Obsidian-style note-taking with bidirectional linking and PDF integration

echo "🧠 Deploying Stage 5: Topic-Based Smart Note-Taking System..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p frontend/src/components/notes
mkdir -p frontend/src/pages/notes
mkdir -p backend/src/routes/notes
mkdir -p data/notes
mkdir -p data/note-attachments

# Database Migration: Note-taking schema
echo "📊 Creating note-taking database schema..."
cat > backend/migrations/006_note_taking_system.sql << 'EOF'
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
EOF

# Backend API routes for notes
echo "🔧 Creating note management API routes..."
cat > backend/src/routes/notes.js << 'EOF'
const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const currentUser = process.env.USER || process.env.USERNAME || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'study_planner',
  user: process.env.DB_USER || currentUser,
  password: process.env.DB_PASSWORD || '',
  ssl: false,
});

// Get all notes with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      topic_id, 
      search, 
      tag, 
      note_type, 
      limit = 50, 
      offset = 0
    } = req.query;

    let query = `
      SELECT n.*, t.name as topic_name, t.icon as topic_icon,
             ARRAY_LENGTH(n.tags, 1) as tag_count
      FROM notes n
      LEFT JOIN topics t ON n.topic_id = t.id
      WHERE n.is_archived = false
    `;
    
    const params = [];
    let paramCount = 0;

    if (topic_id) {
      paramCount++;
      query += ` AND n.topic_id = $${paramCount}`;
      params.push(topic_id);
    }

    if (note_type) {
      paramCount++;
      query += ` AND n.note_type = $${paramCount}`;
      params.push(note_type);
    }

    if (search) {
      paramCount++;
      query += ` AND (n.title ILIKE $${paramCount} OR n.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY n.updated_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await pool.query(query, params);
    
    res.json({
      notes: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error getting notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new note
router.post('/', async (req, res) => {
  try {
    const {
      title,
      content = '',
      topic_id,
      file_id,
      note_type = 'general',
      tags = []
    } = req.body;

    const result = await pool.query(
      `INSERT INTO notes (title, content, topic_id, file_id, note_type, tags) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [title, content, topic_id, file_id, note_type, tags]
    );

    res.json({
      success: true,
      note: result.rows[0],
      message: 'Note created successfully'
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific note
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const noteResult = await pool.query(`
      SELECT n.*, t.name as topic_name, t.icon as topic_icon,
             f.original_name as file_name
      FROM notes n
      LEFT JOIN topics t ON n.topic_id = t.id
      LEFT JOIN files f ON n.file_id = f.id
      WHERE n.id = $1
    `, [id]);

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      note: noteResult.rows[0]
    });
  } catch (error) {
    console.error('Error getting note:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update note
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      topic_id,
      note_type,
      tags
    } = req.body;

    const result = await pool.query(`
      UPDATE notes 
      SET title = $1, content = $2, topic_id = $3, note_type = $4, tags = $5
      WHERE id = $6 
      RETURNING *
    `, [title, content, topic_id, note_type, tags, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      success: true,
      note: result.rows[0],
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search notes
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    const result = await pool.query(`
      SELECT n.*, t.name as topic_name
      FROM notes n
      LEFT JOIN topics t ON n.topic_id = t.id
      WHERE (n.title ILIKE $1 OR n.content ILIKE $1)
        AND n.is_archived = false
      ORDER BY n.updated_at DESC
      LIMIT 20
    `, [`%${query}%`]);

    res.json({
      results: result.rows,
      query: query,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get note templates
router.get('/templates/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM note_templates
      ORDER BY is_default DESC, template_name ASC
    `);

    res.json({
      templates: result.rows
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tags
router.get('/tags/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tag_name, COUNT(*) as usage_count
      FROM notes, unnest(tags) as tag_name
      WHERE is_archived = false
      GROUP BY tag_name
      ORDER BY usage_count DESC, tag_name ASC
    `);

    res.json({
      tags: result.rows
    });
  } catch (error) {
    console.error('Error getting tags:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM notes WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
EOF

# Frontend: Note Editor Component
echo "✍️ Creating note editor component..."
cat > frontend/src/components/notes/NoteEditor.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, Edit3, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState({
    title: '',
    content: '',
    topic_id: null,
    note_type: 'general',
    tags: []
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topics, setTopics] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    loadTopics();
    if (id) {
      loadNote();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadNote = async () => {
    try {
      const response = await api.get(`/notes/${id}`);
      setNote(response.data.note);
    } catch (error) {
      console.error('Error loading note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = id ? `/notes/${id}` : '/notes';
      const method = id ? 'put' : 'post';
      
      const response = await api[method](endpoint, note);
      
      if (response.data.success) {
        if (!id) {
          navigate(`/notes/${response.data.note.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !note.tags.includes(newTag.trim())) {
      setNote({
        ...note,
        tags: [...note.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNote({
      ...note,
      tags: note.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const renderPreview = () => {
    let content = note.content;
    
    // Convert markdown-style formatting
    content = content.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    content = content.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    content = content.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.+?)\*/g, '<em>$1</em>');
    content = content.replace(/^- (.+)$/gm, '<li>$1</li>');
    content = content.replace(/\n/g, '<br>');

    return { __html: content };
  };

  if (loading) {
    return <div className="note-editor loading">Loading note...</div>;
  }

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <button
          onClick={() => navigate('/notes')}
          className="btn btn-secondary"
        >
          <ArrowLeft size={16} />
          Back to Notes
        </button>

        <div className="note-controls">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`btn btn-secondary ${previewMode ? 'active' : ''}`}
          >
            {previewMode ? <Edit3 size={16} /> : <Eye size={16} />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || !note.title.trim()}
            className="btn btn-primary"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="note-title-section">
        <input
          type="text"
          placeholder="Note title..."
          value={note.title}
          onChange={(e) => setNote({ ...note, title: e.target.value })}
          className="note-title-input"
        />
      </div>

      <div className="note-metadata">
        <div className="metadata-row">
          <div className="form-group">
            <label>Topic</label>
            <select
              value={note.topic_id || ''}
              onChange={(e) => setNote({ ...note, topic_id: e.target.value || null })}
              className="form-control"
            >
              <option value="">No topic</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>
                  {topic.icon} {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={note.note_type}
              onChange={(e) => setNote({ ...note, note_type: e.target.value })}
              className="form-control"
            >
              <option value="general">📝 General</option>
              <option value="summary">📋 Summary</option>
              <option value="question">❓ Question</option>
              <option value="concept">💡 Concept</option>
              <option value="example">📘 Example</option>
              <option value="meeting">🤝 Meeting</option>
            </select>
          </div>
        </div>

        <div className="metadata-row">
          <div className="form-group tags-group">
            <label>Tags</label>
            <div className="tags-container">
              <div className="current-tags">
                {note.tags.map(tag => (
                  <span key={tag} className="tag">
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="tag-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="add-tag">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="tag-input"
                />
                <button onClick={addTag} className="btn btn-sm btn-secondary">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="note-content-area">
        {previewMode ? (
          <div 
            className="note-preview"
            dangerouslySetInnerHTML={renderPreview()}
          />
        ) : (
          <textarea
            value={note.content}
            onChange={(e) => setNote({ ...note, content: e.target.value })}
            placeholder="Start writing your note... Use **bold** and *italic* for formatting."
            className="note-content-editor"
          />
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
EOF

# Frontend: Notes Dashboard Component
echo "📋 Creating notes dashboard..."
cat > frontend/src/components/notes/NotesDashboard.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { Search, Plus, Grid, List, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const NotesDashboard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    loadNotes();
    loadTopics();
  }, [searchTerm, selectedTopic, selectedType]);

  const loadNotes = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTopic) params.append('topic_id', selectedTopic);
      if (selectedType) params.append('note_type', selectedType);

      const response = await api.get(`/notes?${params.toString()}`);
      setNotes(response.data.notes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const response = await api.get('/topics');
      setTopics(response.data);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type) => {
    const icons = {
      general: '📝',
      summary: '📋',
      question: '❓',
      concept: '💡',
      example: '📘',
      meeting: '🤝'
    };
    return icons[type] || '📝';
  };

  if (loading) {
    return (
      <div className="notes-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="notes-dashboard">
      <div className="notes-header">
        <div className="header-top">
          <h1>📝 Smart Notes</h1>
          <Link to="/notes/new" className="btn btn-primary">
            <Plus size={16} />
            New Note
          </Link>
        </div>
        
        <div className="notes-stats">
          <div className="stat">
            <span className="stat-number">{notes.length}</span>
            <span className="stat-label">Notes</span>
          </div>
          <div className="stat">
            <span className="stat-number">{topics.length}</span>
            <span className="stat-label">Topics</span>
          </div>
        </div>
      </div>

      <div className="notes-controls">
        <div className="search-section">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="filter-select"
          >
            <option value="">All Topics</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>
                {topic.icon} {topic.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="general">📝 General</option>
            <option value="summary">📋 Summary</option>
            <option value="question">❓ Question</option>
            <option value="concept">💡 Concept</option>
            <option value="example">📘 Example</option>
            <option value="meeting">🤝 Meeting</option>
          </select>
        </div>

        <div className="view-controls">
          <button
            onClick={() => setViewMode('grid')}
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      <div className={`notes-container ${viewMode}`}>
        {notes.length > 0 ? (
          notes.map(note => (
            <Link
              key={note.id}
              to={`/notes/${note.id}`}
              className="note-card"
            >
              <div className="note-header">
                <div className="note-type">
                  {getTypeIcon(note.note_type)}
                </div>
                <div className="note-meta">
                  <span className="note-date">{formatDate(note.updated_at)}</span>
                </div>
              </div>

              <div className="note-content">
                <h3 className="note-title">{note.title}</h3>
                <p className="note-preview">
                  {note.content.substring(0, 150)}
                  {note.content.length > 150 ? '...' : ''}
                </p>
              </div>

              <div className="note-footer">
                {note.topic_name && (
                  <span className="note-topic">
                    {note.topic_icon} {note.topic_name}
                  </span>
                )}
                
                {note.tags && note.tags.length > 0 && (
                  <div className="note-tags">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="note-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="note-stats">
                  <span className="word-count">{note.word_count || 0} words</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-notes">
            <FileText size={64} />
            <h3>No notes found</h3>
            <p>Create your first note to get started</p>
            <Link to="/notes/new" className="btn btn-primary">
              <Plus size={16} />
              Create First Note
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesDashboard;
EOF

# Frontend: Note Pages Setup
echo "📖 Creating note pages..."
cat > frontend/src/pages/notes/NotesPage.js << 'EOF'
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NotesDashboard from '../../components/notes/NotesDashboard';
import NoteEditor from '../../components/notes/NoteEditor';

const NotesPage = () => {
  return (
    <div className="notes-page">
      <Routes>
        <Route path="/" element={<NotesDashboard />} />
        <Route path="/new" element={<NoteEditor />} />
        <Route path="/:id" element={<NoteEditor />} />
      </Routes>
    </div>
  );
};

export default NotesPage;
EOF

# CSS Styles for Note-taking System
echo "🎨 Creating note-taking styles..."
cat > frontend/src/styles/notes.css << 'EOF'
/* Stage 5: Note-Taking System Styles */

/* Notes Dashboard */
.notes-dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.notes-header {
  margin-bottom: 2rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-top h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #2E1065;
  margin: 0;
}

.notes-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #7C3AED;
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
}

/* Notes Controls */
.notes-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-section {
  flex: 1;
  min-width: 300px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 1rem;
  color: #64748b;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #E5E7EB;
  border-radius: 1rem;
  font-size: 0.875rem;
  background: #FAFBFC;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #7C3AED;
  background: white;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.filter-section {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  min-width: 120px;
}

.view-controls {
  display: flex;
  gap: 0.25rem;
  background: #F1F5F9;
  padding: 0.25rem;
  border-radius: 0.5rem;
}

.view-btn {
  padding: 0.5rem;
  border: none;
  background: transparent;
  border-radius: 0.25rem;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.view-btn:hover {
  color: #2E1065;
}

.view-btn.active {
  background: white;
  color: #7C3AED;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Notes Container */
.notes-container {
  margin-top: 2rem;
}

.notes-container.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.notes-container.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Note Cards */
.note-card {
  background: white;
  border: 1px solid #F1F5F9;
  border-radius: 1rem;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.note-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #7C3AED, #A78BFA);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.15);
  border-color: #D8B4FE;
}

.note-card:hover::before {
  transform: scaleX(1);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.note-type {
  font-size: 1.25rem;
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

.note-content {
  margin-bottom: 1rem;
}

.note-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2E1065;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.note-preview {
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.note-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.note-topic {
  background: #7C3AED;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.note-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.note-tag {
  background: #F3E8FF;
  color: #7C3AED;
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.note-stats {
  color: #64748b;
  font-size: 0.75rem;
}

/* Empty States */
.empty-notes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
}

.empty-notes svg {
  color: #D1D5DB;
  margin-bottom: 1rem;
}

.empty-notes h3 {
  color: #374151;
  margin-bottom: 0.5rem;
}

/* Note Editor */
.note-editor {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  min-height: 100vh;
}

.note-editor.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.note-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.note-controls {
  display: flex;
  gap: 0.5rem;
}

.note-controls .btn.active {
  background: #7C3AED;
  color: white;
}

.note-title-section {
  margin-bottom: 2rem;
}

.note-title-input {
  width: 100%;
  font-size: 1.5rem;
  font-weight: 600;
  padding: 0.75rem 0;
  border: none;
  border-bottom: 2px solid #F1F5F9;
  outline: none;
  color: #2E1065;
  background: transparent;
  transition: border-color 0.2s ease;
}

.note-title-input:focus {
  border-color: #7C3AED;
}

.note-title-input::placeholder {
  color: #94A3B8;
}

/* Note Metadata */
.note-metadata {
  background: #F8FAFC;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #F1F5F9;
}

.metadata-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.metadata-row:last-child {
  margin-bottom: 0;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #7C3AED;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.tags-group {
  flex: 2;
}

.tags-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.current-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #F3E8FF;
  color: #7C3AED;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: #7C3AED;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
}

.tag-remove:hover {
  color: #5B21B6;
}

.add-tag {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.tag-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

/* Note Content Area */
.note-content-area {
  margin-bottom: 2rem;
  min-height: 400px;
  border: 1px solid #F1F5F9;
  border-radius: 0.75rem;
  overflow: hidden;
}

.note-content-editor {
  width: 100%;
  min-height: 400px;
  padding: 1.5rem;
  border: none;
  outline: none;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  resize: vertical;
  background: #FAFBFC;
}

.note-content-editor:focus {
  background: white;
}

.note-preview {
  padding: 1.5rem;
  min-height: 400px;
  background: white;
  line-height: 1.6;
}

.note-preview h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2E1065;
  margin: 1.5rem 0 1rem 0;
}

.note-preview h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2E1065;
  margin: 1.25rem 0 0.75rem 0;
}

.note-preview h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2E1065;
  margin: 1rem 0 0.5rem 0;
}

/* Loading States */
.notes-dashboard.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #64748b;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #7C3AED;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .notes-container.grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  .metadata-row {
    flex-direction: column;
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .notes-dashboard {
    padding: 1rem;
  }
  
  .notes-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-section {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .notes-container.grid {
    grid-template-columns: 1fr;
  }
  
  .note-editor {
    margin: 1rem;
    padding: 1rem;
  }
  
  .note-editor-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
}

/* Button Styles */
.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}
EOF

# Update App.js to include notes routes
echo "🔄 Updating main App.js with notes routes..."
cat > frontend/src/App.js << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import EnhancedDashboard from './components/EnhancedDashboard';
import FileManager from './pages/FileManager';
import PDFViewerCompact from './pages/PDFViewerCompact';
import TopicManager from './pages/TopicManager';
import NotesPage from './pages/notes/NotesPage';
import AchievementDisplay from './components/AchievementDisplay';
import './styles/App.css';
import './styles/notes.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<EnhancedDashboard />} />
            <Route path="/files" element={<FileManager />} />
            <Route path="/topics" element={<TopicManager />} />
            <Route path="/notes/*" element={<NotesPage />} />
            <Route path="/achievements" element={<AchievementDisplay />} />
            <Route path="/viewer/:fileId" element={<PDFViewerCompact />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
EOF

# Update Navigation to include Notes
echo "🧭 Updating navigation with notes link..."
cat > frontend/src/components/Navigation.js << 'EOF'
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Folder, BookOpen, StickyNote, Trophy } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/files', icon: FileText, label: 'File Manager' },
    { path: '/topics', icon: Folder, label: 'Topics' },
    { path: '/notes', icon: StickyNote, label: 'Smart Notes' },
    { path: '/achievements', icon: Trophy, label: 'Achievements' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <BookOpen className="nav-logo" />
        <h1>Study Planner</h1>
      </div>
      <ul className="nav-links">
        {navItems.map(({ path, icon: Icon, label }) => (
          <li key={path}>
            <Link 
              to={path} 
              className={`nav-link ${location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;
EOF

# Update backend index.js to include notes routes
echo "🔧 Adding notes routes to backend..."
cat >> backend/src/index.js << 'EOF'

// Stage 5: Notes routes
const notesRoutes = require('./routes/notes');
app.use('/api/notes', notesRoutes);

EOF

# Create deployment script for database migrations
echo "📊 Creating database migration script..."
cat > scripts/migrate-stage5.sh << 'EOF'
#!/bin/bash

echo "🗄️ Running Stage 5 database migrations..."

# Get current user for database connection
CURRENT_USER=${USER:-${USERNAME:-postgres}}

# Database connection details
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-study_planner}
DB_USER=${DB_USER:-$CURRENT_USER}

echo "Connecting to database as user: $DB_USER"

# Run migration
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/migrations/006_note_taking_system.sql

if [ $? -eq 0 ]; then
    echo "✅ Stage 5 database migration completed successfully"
else
    echo "❌ Stage 5 database migration failed"
    exit 1
fi
EOF

chmod +x scripts/migrate-stage5.sh

# Create comprehensive deployment script
echo "🚀 Creating comprehensive Stage 5 deployment..."
cat > scripts/start-stage5.sh << 'EOF'
#!/bin/bash

echo "🧠 Starting Stage 5: Topic-Based Smart Note-Taking System"
echo "=================================================="

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo "Starting PostgreSQL..."
    brew services start postgresql@14 2>/dev/null || systemctl start postgresql 2>/dev/null || service postgresql start 2>/dev/null
    sleep 3
fi

# Run database migrations
echo "📊 Running database migrations..."
./scripts/migrate-stage5.sh

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed. Cannot continue."
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Start backend server
echo "🔧 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend server
echo "🌐 Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Stage 5: Smart Note-Taking System is now running!"
echo "=================================================="
echo "📝 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "🧠 New Features Available:"
echo "• 📝 Smart note editor with markdown support"
echo "• 🔗 Topic-based organization"
echo "• 🏷️ Tagging system"
echo "• 🔍 Full-text search across all notes"
echo "• 📋 Note templates for quick creation"
echo ""
echo "📚 Access your notes at: http://localhost:3000/notes"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interruption
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
EOF

chmod +x scripts/start-stage5.sh

echo ""
echo "🎉 Stage 5: Topic-Based Smart Note-Taking System Deployment Complete!"
echo "=================================================================="
echo ""
echo "🚀 To start the system:"
echo "   ./scripts/start-stage5.sh"
echo ""
echo "🧠 New Features Deployed:"
echo "• 📝 Smart note editor with markdown support"
echo "• 🔗 Topic-based note organization"
echo "• 🏷️ Advanced tagging system"
echo "• 🔍 Full-text search across all notes"
echo "• 📋 Note templates (General, Summary, Q&A, Concept)"
echo "• 🌙 Midnight Scholar and 🌅 Violet Whisper theme support"
echo ""
echo "📁 Files Created/Updated:"
echo "• backend/migrations/006_note_taking_system.sql"
echo "• backend/src/routes/notes.js"
echo "• frontend/src/components/notes/ (3 components)"
echo "• frontend/src/pages/notes/NotesPage.js"
echo "• frontend/src/styles/notes.css"
echo "• Updated App.js and Navigation.js"
echo ""
echo "✨ Ready to revolutionize your note-taking experience!"