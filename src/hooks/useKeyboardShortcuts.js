import { useEffect, useCallback } from 'react';

/**
 * Кастомный хук для обработки клавиши Escape
 * @param {Object} handlers - объект с функциями обратного вызова
 */
const useKeyboardShortcuts = (handlers = {}) => {
  const handleEscape = useCallback(() => {
    if (handlers.onCloseTrailer) handlers.onCloseTrailer();
    if (handlers.onCloseNoTrailer) handlers.onCloseNoTrailer();
    if (handlers.onCloseProfile) handlers.onCloseProfile();
    if (handlers.onCloseFilter) handlers.onCloseFilter();
    if (handlers.onCloseMenu) handlers.onCloseMenu();
  }, [handlers]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleEscape]);
};

export default useKeyboardShortcuts;
