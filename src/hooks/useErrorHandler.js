import { useState, useCallback } from 'react';
import { logApiError, getUserErrorMessage } from '../utils/apiErrors';


export const useErrorHandler = (language = 'ru') => {
  const [error, setError] = useState(null);

  const handleError = useCallback(
    (err, context = {}) => {
      logApiError(err, context);
      setError(getUserErrorMessage(err, language));
    },
    [language]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, clearError, handleError };
};

export default useErrorHandler;
