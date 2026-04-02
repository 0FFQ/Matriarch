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
  onSuggestionClick,
  onFilterClick,
  hasActiveFilters
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
    // Отложенная проверка чтобы дать время на переход фокуса
    setTimeout(() => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.classList.contains('filter-icon')) {
        return;
      }
      if (!query && !searchActive) {
        setIsExpanded(false);
      }
    }, 10);
  }, [query, searchActive]);

  const handleFilterClick = useCallback((e) => {
    e.stopPropagation();
    onFilterClick();
  }, [onFilterClick]);

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
      {/* Прозрачная кнопка на весь экран */}
      <motion.button
        className="search-trigger-overlay"
        onClick={handleIconClick}
        initial={{ opacity: 1 }}
        animate={{ opacity: isExpanded ? 0 : 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ pointerEvents: isExpanded ? 'none' : 'auto' }}
      />

      {/* Строка поиска */}
      <motion.div
        className="search-bar"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: isExpanded ? 480 : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ overflow: 'visible', maxWidth: '90vw' }}
      >
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
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
          </div>
        </form>
      </motion.div>

      {/* Выпадающий список с подсказками */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            className="suggestions-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
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

      {/* Правая иконка: Фильтр */}
      <motion.div
        className={`search-icon-right ${isExpanded ? 'visible' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.2, delay: isExpanded ? 1 : 0 }}
      >
        <button
          className={`search-icon-only filter-icon ${hasActiveFilters ? 'has-filters' : ''}`}
          onClick={handleFilterClick}
          type="button"
        >
          <Sliders size={24} />
        </button>
      </motion.div>
    </div>
  );
});

export default SearchBar;
