import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Film, Tv, Sliders } from 'lucide-react';

const SearchBar = memo(({
  query,
  setQuery,
  onSearch,
  searchActive,
  setSearchActive,
  loading,
  suggestions,
  onSuggestionClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setSearchActive(true);
    }
  }, [query, onSearch, setSearchActive]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSearchActive(false);
    setIsExpanded(false);
    inputRef.current?.focus();
  }, [setQuery, setSearchActive]);

  const handleSelect = useCallback((title) => {
    if (onSuggestionClick) {
      onSuggestionClick(title);
    }
  }, [onSuggestionClick]);

  const handleIconClick = useCallback(() => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleInputBlur = useCallback(() => {
    if (!query && !searchActive) {
      setIsExpanded(false);
    }
  }, [query, searchActive]);

  const showSuggestions = useMemo(() => 
    suggestions.length > 0 && isExpanded && !searchActive && !loading,
    [suggestions.length, isExpanded, searchActive, loading]
  );

  useEffect(() => {
    if (query || searchActive) {
      setIsExpanded(true);
    }
  }, [query, searchActive]);

  return (
    <div className="search-bar-wrapper">
      {/* ЛЕВАЯ ИКОНКА: Лупа (видна ВСЕГДА) */}
      <div className="search-icon-left">
        <div 
          className="search-icon-only" 
          onClick={handleIconClick}
        >
          <Search size={24} />
        </div>
      </div>

      {/* ЦЕНТР: Строка поиска */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="search-bar expanded"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'min(90vw, 480px)' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <form className="search-form" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                className="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={handleInputBlur}
              />

              {query && (
                <motion.button 
                  type="button" 
                  className="clear-btn" 
                  onClick={handleClear}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X size={14} />
                </motion.button>
              )}
            </form>

            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  className="suggestions-list"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {suggestions.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      className="suggestion-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleSelect(item.title || item.name)}
                    >
                      {item.poster_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                          alt=""
                          className="suggestion-poster"
                          loading="lazy"
                        />
                      )}
                      <div className="suggestion-info">
                        <span className="suggestion-title">{item.title || item.name}</span>
                        <span className="suggestion-meta">
                          {item.media_type === 'tv' ? <Tv size={14} /> : <Film size={14} />}
                          {item.media_type === 'tv' ? ' Сериал' : ' Фильм'}
                          {item.release_date || item.first_air_date
                            ? ` • ${new Date(item.release_date || item.first_air_date).getFullYear()}`
                            : ''}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ПРАВАЯ ИКОНКА: Фильтр (виден когда раскрыто) */}
      <div className="search-icon-right">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="search-icon-only filter-icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sliders size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default SearchBar;
