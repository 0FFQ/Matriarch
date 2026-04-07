import React from 'react';
import { IMAGE_BASE } from '../../constants';
import SearchSection from './SearchSection';
import ResultsSection from './ResultsSection';
import LoadingOverlay from '../common/LoadingOverlay';

/**
 * Компонент секции поиска и результатов
 * @param {Object} search - объект поиска
 * @param {Object} pagination - объект пагинации
 * @param {Object} trailerControls - обработчики трейлера
 * @param {Object} socialHandlers - обработчики соц. функций
 * @param {string} language - текущий язык
 * @param {boolean} filterOpen - открыт ли фильтр
 * @param {function} toggleFilter - переключение фильтра
 * @param {function} resetSearch - сброс поиска
 * @param {Object} t - объект с переводами
 */
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
      {/* Поисковая секция */}
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

      {/* Глобальный индикатор загрузки */}
      {search.loading && <LoadingOverlay language={language} />}

      {/* Результаты поиска */}
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
