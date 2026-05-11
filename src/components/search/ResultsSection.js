import React from 'react';
import { AnimatePresence } from 'framer-motion';
import ResultsList from './ResultsList';
import PaginationControls from '../common/PaginationControls';


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
