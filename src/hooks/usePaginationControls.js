import { useCallback } from 'react';

/**
 * Кастомный хук для управления пагинацией
 * @param {number} totalItems - общее количество элементов
 * @param {number} itemsPerPage - количество элементов на странице
 * @param {number} currentPage - текущая страница
 * @param {function} setCurrentPage - функция установки страницы
 * @returns {Object} состояние и функции для управления пагинацией
 */
const usePaginationControls = (totalItems, itemsPerPage, currentPage, setCurrentPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getPaginatedItems = useCallback((items) => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  }, [currentPage, itemsPerPage]);

  const handlePageChange = useCallback((direction) => {
    if (direction === 'next') {
      setCurrentPage(prev => prev >= totalPages ? 1 : prev + 1);
    } else {
      setCurrentPage(prev => prev <= 1 ? totalPages : prev - 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages, setCurrentPage]);

  return {
    totalPages,
    paginatedItems: null, // Будет вычислен при вызове getPaginatedItems
    getPaginatedItems,
    handlePageChange,
    hasMultiplePages: totalPages > 1
  };
};

export default usePaginationControls;
