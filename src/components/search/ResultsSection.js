import React from 'react';
import { AnimatePresence } from 'framer-motion';
import ResultsList from './ResultsList';
import PaginationControls from '../common/PaginationControls';

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
 * @param {Object} t - объект с переводами
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
  searchActive,
  t
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
          t={t}
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
