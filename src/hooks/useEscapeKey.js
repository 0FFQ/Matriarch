import { useEffect } from 'react';


const useEscapeKey = (handlers = {}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (handlers.onCloseTrailer) handlers.onCloseTrailer();
        if (handlers.onCloseNoTrailer) handlers.onCloseNoTrailer();
        if (handlers.onCloseProfile) handlers.onCloseProfile();
        if (handlers.onCloseFilter) handlers.onCloseFilter();
        if (handlers.onCloseMenu) handlers.onCloseMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handlers]);
};

export default useEscapeKey;
