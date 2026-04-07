import React from 'react';
import { motion } from 'framer-motion';

/**
 * Компонент управления пагинацией
 * @param {number} currentPage - текущая страница
 * @param {number} totalPages - всего страниц
 * @param {function} onPageChange - функция обратного вызова при смене страницы
 */
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <>
      <motion.div
        className="pagination-indicator"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <span className="page-number">{currentPage} / {totalPages}</span>
      </motion.div>

      <button className="page-nav-full page-nav-left" onClick={() => onPageChange('prev')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      <button className="page-nav-full page-nav-right" onClick={() => onPageChange('next')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </>
  );
};

export default PaginationControls;
