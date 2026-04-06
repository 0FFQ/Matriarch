import React, {
  useState,
  useEffect,
  useRef,
  memo,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Film, Tv, Home, Sliders } from "lucide-react";

/**
 * Строка поиска с автодополнением
 */
const SearchBar = memo(
  ({
    query,
    setQuery,
    onSearch,
    searchActive,
    setSearchActive,
    loading,
    suggestions,
    onSuggestionClick,
    onFilterClick,
    onHomeClick,
    hasActiveFilters,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const inputRef = useRef(null);

    // ============================================
    // Обработчики
    // ============================================

    /**
     * Отправить форму поиска
     */
    const handleSubmit = useCallback(
      (event) => {
        event.preventDefault();
        if (query.trim()) {
          onSearch(query);
          setSearchActive(true);
        }
      },
      [query, onSearch, setSearchActive]
    );

    /**
     * Очистить поиск
     */
    const handleClear = useCallback(() => {
      setQuery("");
      setSearchActive(false);
      setIsExpanded(false);
      inputRef.current?.focus();
    }, [setQuery, setSearchActive]);

    /**
     * Выбрать подсказку
     */
    const handleSelect = useCallback(
      (title) => {
        if (onSuggestionClick) {
          onSuggestionClick(title);
        }
      },
      [onSuggestionClick]
    );

    /**
     * Клик по иконке — раскрыть поиск
     */
    const handleIconClick = useCallback(() => {
      setIsExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    /**
     * Потеря фокуса — свернуть если пусто
     */
    const handleInputBlur = useCallback(() => {
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement?.classList.contains("filter-icon")) {
          return;
        }
        if (!query && !searchActive) {
          setIsExpanded(false);
        }
      }, 10);
    }, [query, searchActive]);

    /**
     * Клик по фильтру
     */
    const handleFilterClick = useCallback(
      (event) => {
        event.stopPropagation();
        onFilterClick();
      },
      [onFilterClick]
    );

    // ============================================
    // Эффекты
    // ============================================

    // Показывать подсказки только при подходящих условиях
    const showSuggestions = useMemo(
      () =>
        suggestions.length > 0 &&
        isExpanded &&
        !searchActive &&
        !loading,
      [suggestions.length, isExpanded, searchActive, loading]
    );

    // Автоматическое раскрытие/сворачивание
    useEffect(() => {
      if (query || searchActive) {
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    }, [query, searchActive]);

    // ============================================
    // Рендер
    // ============================================

    return (
      <div className="search-bar-wrapper">
        {/* Прозрачная кнопка-оверлей для активации поиска */}
        <motion.button
          className="search-trigger-overlay"
          onClick={handleIconClick}
          initial={{ opacity: 1 }}
          animate={{ opacity: isExpanded ? 0 : 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ pointerEvents: isExpanded ? "none" : "auto" }}
          aria-label="Активировать поиск"
        />

        {/* Левая иконка: Домой */}
        <motion.div
          className={`search-icon-left ${isExpanded ? "visible" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.2, delay: isExpanded ? 1 : 0 }}
        >
          <button
            className="search-icon-only home-icon"
            onClick={onHomeClick}
            type="button"
            aria-label="На главную"
          >
            <Home size={24} />
          </button>
        </motion.div>

        {/* Строка поиска */}
        <motion.div
          className="search-bar"
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: isExpanded ? 480 : 0,
            opacity: isExpanded ? 1 : 0,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ overflow: "visible", maxWidth: "90vw" }}
        >
          <form className="search-form" onSubmit={handleSubmit}>
            <div className="search-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit(e);
                  }
                }}
                onBlur={handleInputBlur}
                disabled={loading}
                placeholder="Поиск..."
              />

              {/* Кнопка очистки */}
              {query && !loading && (
                <motion.button
                  type="button"
                  className="clear-btn"
                  onClick={handleClear}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.15 }}
                  aria-label="Очистить поиск"
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
              {suggestions.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="suggestion-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() =>
                    handleSelect(item.title || item.name)
                  }
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
                    <span className="suggestion-title">
                      {item.title || item.name}
                    </span>
                    <span className="suggestion-meta">
                      {item.media_type === "tv" ? (
                        <Tv size={14} />
                      ) : (
                        <Film size={14} />
                      )}
                      {item.media_type === "tv" ? " Сериал" : " Фильм"}
                      {item.release_date || item.first_air_date
                        ? ` • ${new Date(
                            item.release_date || item.first_air_date
                          ).getFullYear()}`
                        : ""}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Правая иконка: Фильтр */}
        <motion.div
          className={`search-icon-right ${isExpanded ? "visible" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.2, delay: isExpanded ? 1 : 0 }}
        >
          <button
            className={`search-icon-only filter-icon ${
              hasActiveFilters ? "has-filters" : ""
            }`}
            onClick={handleFilterClick}
            type="button"
            aria-label="Открыть фильтры"
          >
            <Sliders size={24} />
          </button>
        </motion.div>
      </div>
    );
  }
);

export default SearchBar;
