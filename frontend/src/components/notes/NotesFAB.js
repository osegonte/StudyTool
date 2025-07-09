import React, { useState } from 'react';
import { StickyNote, Plus, Search, BookOpen } from 'lucide-react';

const NotesFAB = ({ 
  fileId, 
  currentPage, 
  onQuickNote, 
  onViewNotes, 
  onSearchNotes,
  noteCount = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQuickNote = () => {
    onQuickNote();
    setIsExpanded(false);
  };

  return (
    <div className={`notes-fab ${isExpanded ? 'expanded' : ''}`}>
      {isExpanded && (
        <div className="fab-menu">
          <button 
            className="fab-action quick-note"
            onClick={handleQuickNote}
            title="Quick Note (Ctrl+Shift+N)"
          >
            <Plus size={16} />
            <span>Quick Note</span>
          </button>
          
          <button 
            className="fab-action view-notes"
            onClick={onViewNotes}
            title="View All Notes"
          >
            <BookOpen size={16} />
            <span>View Notes ({noteCount})</span>
          </button>
          
          <button 
            className="fab-action search-notes"
            onClick={onSearchNotes}
            title="Search Notes"
          >
            <Search size={16} />
            <span>Search</span>
          </button>
        </div>
      )}

      <button 
        className="fab-main"
        onClick={() => setIsExpanded(!isExpanded)}
        title="Notes"
      >
        <StickyNote size={20} />
        {noteCount > 0 && (
          <span className="note-badge">{noteCount}</span>
        )}
      </button>
    </div>
  );
};

export default NotesFAB;
