import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './SearchBar';


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
