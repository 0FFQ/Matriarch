import { useMemo, useCallback } from 'react';

/**
 * Кастомный хук для управления пагинацией
 * @param {number} totalItems - общее количество элементов
 * @param {number} itemsPerPage - количество элементов на странице
 * @returns {Object} состояние и функции для управления пагинацией
 */
const usePagination = (totalItems, itemsPerPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getPaginatedItems = useCallback((items, currentPage) => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  }, [itemsPerPage]);

  const handlePageChange = useCallback((direction, currentPage, setCurrentPage) => {
    if (direction === 'next') {
      setCurrentPage(prev => prev >= totalPages ? 1 : prev + 1);
    } else {
      setCurrentPage(prev => prev <= 1 ? totalPages : prev - 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages]);

  return {
    totalPages,
    getPaginatedItems,
    handlePageChange
  };
};

export default usePagination;
