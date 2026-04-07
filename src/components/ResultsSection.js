import React from 'react';
import { AnimatePresence } from 'framer-motion';
import ResultsList from './ResultsList';
import PaginationControls from './PaginationControls';

/**
 * Компонент секции результатов
 * @param {Array} results - результаты поиска
 * @param {string} imageBase - базовый URL для изображений
 * @param {function} onSelect - обработка выбора элемента
 * @param {boolean} fromCache - из кэша ли данные
 * @param {function} onShareInChat - функция шаринга в чат
 * @param {number} currentPage - текущая страница
 * @param {number} totalPages - всего страниц
 * @param {function} onPageChange - обработка смены страницы
 * @param {boolean} searchActive - флаг активности поиска
 */
const ResultsSection = ({
  results,
  imageBase,
  onSelect,
  fromCache,
  onShareInChat,
  currentPage,
  totalPages,
  onPageChange,
  searchActive
}) => {
  if (!searchActive || results.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        <ResultsList
          results={results}
          imageBase={imageBase}
          onSelect={onSelect}
          fromCache={fromCache}
          onShareInChat={onShareInChat}
        />
      </AnimatePresence>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
};

export default ResultsSection;
