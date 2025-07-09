import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, FileText, StickyNote, Folder } from 'lucide-react';
import api from '../services/api';

const EnhancedSearch = ({ onResults, placeholder = "Search everything..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    files: true,
    notes: true,
    topics: true
  });
  
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      performSearch();
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, filters]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchResults = [];

      // Search files
      if (filters.files) {
        const filesResponse = await api.get(`/files?search=${encodeURIComponent(query)}`);
        searchResults.push(...filesResponse.data.map(item => ({
          ...item,
          type: 'file',
          icon: FileText
        })));
      }

      // Search notes
      if (filters.notes) {
        const notesResponse = await api.get(`/notes/search/${encodeURIComponent(query)}`);
        searchResults.push(...notesResponse.data.results.map(item => ({
          ...item,
          type: 'note',
          icon: StickyNote
        })));
      }

      // Search topics
      if (filters.topics) {
        const topicsResponse = await api.get('/topics');
        const filteredTopics = topicsResponse.data.filter(topic =>
          topic.name.toLowerCase().includes(query.toLowerCase()) ||
          topic.description?.toLowerCase().includes(query.toLowerCase())
        );
        searchResults.push(...filteredTopics.map(item => ({
          ...item,
          type: 'topic',
          icon: Folder
        })));
      }

      setResults(searchResults);
      setIsOpen(true);
      onResults?.(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const getResultUrl = (result) => {
    switch (result.type) {
      case 'file':
        return `/viewer/${result.id}`;
      case 'note':
        return `/notes/${result.id}`;
      case 'topic':
        return `/topics?filter=${result.id}`;
      default:
        return '#';
    }
  };

  return (
    <div className="enhanced-search" ref={searchRef}>
      <div className="search-input-container">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          onFocus={() => query.length > 2 && setIsOpen(true)}
        />
        {query && (
          <button onClick={clearSearch} className="clear-search">
            <X size={16} />
          </button>
        )}
        <div className="search-filters">
          <Filter size={16} />
          <div className="filter-options">
            {Object.entries(filters).map(([key, value]) => (
              <label key={key} className="filter-option">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                />
                <span>{key}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="search-results" ref={resultsRef}>
          {loading ? (
            <div className="search-loading">
              <div className="loading-spinner" />
              <span>Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="results-list">
              {results.slice(0, 10).map((result, index) => {
                const Icon = result.icon;
                return (
                  <a
                    key={`${result.type}-${result.id}`}
                    href={getResultUrl(result)}
                    className="result-item"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="result-icon">
                      <Icon size={16} />
                    </div>
                    <div className="result-content">
                      <div className="result-title">
                        {result.title || result.original_name || result.name}
                      </div>
                      <div className="result-description">
                        {result.content?.substring(0, 100) || 
                         result.description ||
                         `${result.type.charAt(0).toUpperCase() + result.type.slice(1)}`}
                        {result.content?.length > 100 && '...'}
                      </div>
                    </div>
                    <div className="result-type">
                      {result.type}
                    </div>
                  </a>
                );
              })}
              {results.length > 10 && (
                <div className="results-more">
                  +{results.length - 10} more results
                </div>
              )}
            </div>
          ) : (
            <div className="no-results">
              <Search size={24} />
              <span>No results found for "{query}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch;
