import { useCallback } from 'react';

/**
 * Кастомный хук для управления трейлером и связанными действиями
 * @param {Object} trailer - объект трейлера
 * @param {Object} search - объект поиска
 * @returns {Object} обработчики для трейлера
 */
const useTrailerControls = (trailer, search) => {
  // Обработка открытия трейлера
  const handleOpenTrailer = useCallback(async (id, type = 'movie') => {
    await trailer.getTrailer(id, type);
  }, [trailer]);

  // Обработка закрытия трейлера
  const handleCloseTrailer = useCallback(() => {
    trailer.closeTrailer();
  }, [trailer]);

  // Обработка закрытия виджета "нет трейлера"
  const handleCloseNoTrailer = useCallback(() => {
    trailer.closeNoTrailer();
  }, [trailer]);

  return {
    handleOpenTrailer,
    handleCloseTrailer,
    handleCloseNoTrailer
  };
};

export default useTrailerControls;
