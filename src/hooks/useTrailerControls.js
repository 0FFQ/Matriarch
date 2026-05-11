import { useCallback } from 'react';


const useTrailerControls = (trailer, search) => {
  
  const handleOpenTrailer = useCallback(async (id, type = 'movie') => {
    await trailer.getTrailer(id, type);
  }, [trailer]);

  
  const handleCloseTrailer = useCallback(() => {
    trailer.closeTrailer();
  }, [trailer]);

  
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
