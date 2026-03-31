import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Film, Tv } from 'lucide-react';

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
      setSuggestions([]); // Очищаем подсказки после поиска
    }
  }, [query, onSearch, setSearchActive]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSearchActive(false);
    inputRef.current?.focus();
  }, [setQuery, setSearchActive]);

  const handleSelect = useCallback((title) => {
    if (onSuggestionClick) {
      onSuggestionClick(title);
    }
  }, [onSuggestionClick]);

  const handleIconClick = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isExpanded]);

  const handleInputBlur = useCallback(() => {
    // Не сворачиваем если есть searchActive или query
    if (!query && !searchActive) {
      setIsExpanded(false);
    }
  }, [query, searchActive]);

  // Показываем подсказки только когда нет searchActive и loading
  const showSuggestions = useMemo(() => 
    suggestions.length > 0 && isExpanded && !searchActive && !loading,
    [suggestions.length, isExpanded, searchActive, loading]
  );

  // Разворачиваем строку если есть query или searchActive
  useEffect(() => {
    if (query || searchActive) {
      setIsExpanded(true);
    }
  }, [query, searchActive]);

  // Скрываем подсказки когда начинается поиск
  useEffect(() => {
    if (searchActive) {
      // Подсказки скроются автоматически через showSuggestions
    }
  }, [searchActive]);

  return (
    <motion.div
      className="search-bar-wrapper"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <motion.div
        className={`search-bar ${isExpanded ? 'expanded' : ''}`}
        animate={{
          width: isExpanded ? 'min(90vw, 600px)' : '60px',
          borderRadius: isExpanded ? '50px' : '50%'
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <form className="search-form" onSubmit={handleSubmit}>
          <motion.div className="search-icon-wrapper" onClick={handleIconClick} whileHover={{ scale: 1.1 }}>
            <Search size={24} />
          </motion.div>

          <AnimatePresence>
            {isExpanded && (
              <motion.input
                ref={inputRef}
                type="text"
                className="search-input"
                placeholder="Поиск фильмов и сериалов..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={handleInputBlur}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15, delay: 0.05 }}
              />
            )}
          </AnimatePresence>

          {isExpanded && query && (
            <motion.button type="button" className="clear-btn" onClick={handleClear} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.15 }}>
              <X size={16} />
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
    </motion.div>
  );
});

export default SearchBar;
