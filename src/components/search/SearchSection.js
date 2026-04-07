import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './SearchBar';

/**
 * Компонент поисковой секции
 * @param {string} query - поисковый запрос
 * @param {function} setQuery - функция установки запроса
 * @param {function} onSearch - функция поиска
 * @param {boolean} searchActive - флаг активности поиска
 * @param {function} setSearchActive - функция установки активности
 * @param {boolean} loading - флаг загрузки
 * @param {Array} suggestions - подсказки
 * @param {function} onSuggestionClick - обработка клика по подсказке
 * @param {function} onFilterClick - обработка клика по фильтру
 * @param {function} onHomeClick - обработка клика домой
 * @param {boolean} hasActiveFilters - есть ли активные фильтры
 * @param {string} language - текущий язык
 */
const SearchSection = ({
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
  language
}) => {
  return (
    <motion.div className="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
      <AnimatePresence mode="wait">
        <SearchBar
          key="search"
          query={query}
          setQuery={setQuery}
          onSearch={onSearch}
          searchActive={searchActive}
          setSearchActive={setSearchActive}
          loading={loading}
          suggestions={suggestions}
          onSuggestionClick={onSuggestionClick}
          onFilterClick={onFilterClick}
          onHomeClick={onHomeClick}
          hasActiveFilters={hasActiveFilters}
          language={language}
        />
      </AnimatePresence>
    </motion.div>
  );
};

export default SearchSection;
