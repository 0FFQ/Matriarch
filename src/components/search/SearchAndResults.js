import React from 'react';
import { IMAGE_BASE } from '../../constants';
import SearchSection from './SearchSection';
import ResultsSection from './ResultsSection';
import LoadingOverlay from '../common/LoadingOverlay';


const SearchAndResults = ({
  search,
  pagination,
  trailerControls,
  socialHandlers,
  language,
  filterOpen,
  toggleFilter,
  resetSearch,
  t
}) => {
  return (
    <>
      {}
      <SearchSection
        query={search.query}
        setQuery={search.setQuery}
        onSearch={search.searchByText}
        searchActive={search.searchActive}
        setSearchActive={search.setSearchActive}
        loading={search.loading}
        suggestions={search.suggestions}
        onSuggestionClick={search.handleSuggestionClick}
        onFilterClick={toggleFilter}
        onHomeClick={resetSearch}
        hasActiveFilters={search.hasActiveFilters}
        language={language}
        t={t}
      />

      {}
      {search.loading && <LoadingOverlay language={language} />}

      {}
      <ResultsSection
        results={pagination.getPaginatedItems(search.results)}
        imageBase={IMAGE_BASE}
        onSelect={trailerControls.handleOpenTrailer}
        fromCache={search.lastFromCache}
        onShareInChat={socialHandlers.handleShareInChat}
        currentPage={search.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={pagination.handlePageChange}
        searchActive={search.searchActive}
        t={t}
      />
    </>
  );
};

export default SearchAndResults;
