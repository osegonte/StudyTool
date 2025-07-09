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
