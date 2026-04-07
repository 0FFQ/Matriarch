import { useState, useCallback } from 'react';
import axios from 'axios';
import { cachedRequest } from '../utils/cache';
import { BASE_URL, CACHE_TTL, AUTH_TOKEN } from '../constants';

/**
 * Кастомный хук для управления трейлерами
 * @param {Array} results - массив результатов поиска
 * @param {string} language - текущий язык
 * @returns {Object} состояние и функции для управления трейлерами
 */
const useTrailer = (results, language) => {
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [noTrailer, setNoTrailer] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);

  // Получение трейлера
  const getTrailer = useCallback(async (id, type = 'movie') => {
    try {
      const { data } = await cachedRequest(
        axios,
        BASE_URL,
        `/${type}/${id}/videos`,
        { language },
        { Authorization: `Bearer ${AUTH_TOKEN}` },
        CACHE_TTL.TRAILERS
      );

      const trailer = data.results.find(
        v => v.site === 'YouTube' && ['Trailer', 'Teaser', 'Clip'].includes(v.type)
      );

      if (trailer) {
        setSelectedTrailer({ key: trailer.key, title: trailer.name });
      } else {
        const movie = results.find(m => m.id === id);
        if (movie) {
          setCurrentMovie({
            title: movie.title || movie.name || 'Фильм',
            year: (movie.release_date || movie.first_air_date || '').split('-')[0] || 'N/A',
            type: movie.media_type || type
          });
          setNoTrailer(true);
        }
      }
    } catch (err) {
      console.error('Trailer fetch failed:', err.message);
      setNoTrailer(true);
    }
  }, [results, language]);

  // Закрытие трейлера
  const closeTrailer = useCallback(() => {
    setSelectedTrailer(null);
  }, []);

  // Закрытие виджета "трейлер не найден"
  const closeNoTrailer = useCallback(() => {
    setNoTrailer(false);
    setCurrentMovie(null);
  }, []);

  return {
    selectedTrailer,
    noTrailer,
    currentMovie,
    getTrailer,
    closeTrailer,
    closeNoTrailer
  };
};

export default useTrailer;
