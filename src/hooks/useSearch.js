import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { cachedRequest, getCacheStats } from '../utils/cache';
import { BASE_URL, CACHE_TTL, AUTH_TOKEN } from '../constants';
import { getSortField, sortResults } from '../utils/searchUtils';

/**
 * Кастомный хук для управления поиском и фильтрами
 * @param {string} language - текущий язык
 * @returns {Object} состояние и функции для управления поиском
 */
const useSearch = (language) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    genre: '',
    year: '',
    rating: '',
    sortBy: 'popularity.desc',
    animeOnly: false
  });
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastFromCache, setLastFromCache] = useState(false);

  const debounceRef = useRef(null);

  // Загрузка жанров
  useEffect(() => {
    const loadGenres = async () => {
      setLoadingGenres(true);
      try {
        const [movieResponse, tvResponse] = await Promise.all([
          cachedRequest(
            axios,
            BASE_URL,
            '/genre/movie/list',
            { language },
            { Authorization: `Bearer ${AUTH_TOKEN}` },
            CACHE_TTL.GENRES
          ),
          cachedRequest(
            axios,
            BASE_URL,
            '/genre/tv/list',
            { language },
            { Authorization: `Bearer ${AUTH_TOKEN}` },
            CACHE_TTL.GENRES
          )
        ]);

        const allGenres = [...movieResponse.data.genres, ...tvResponse.data.genres];
        const uniqueGenres = allGenres.filter(
          (genre, index, self) => index === self.findIndex(g => g.id === genre.id)
        );
        setGenres(uniqueGenres);
      } catch (err) {
        console.error('Failed to load genres:', err.message);
      }
      setLoadingGenres(false);
    };
    loadGenres();
  }, [language]);

  // Поиск подсказок
  useEffect(() => {
    if (query.length > 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          const { data, fromCache } = await cachedRequest(
            axios,
            BASE_URL,
            '/search/multi',
            { query, language },
            { Authorization: `Bearer ${AUTH_TOKEN}` },
            CACHE_TTL.SUGGESTIONS
          );

          const filtered = data.results.filter(
            item => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
          );
          setSuggestions(filtered.slice(0, 8));
        } catch (err) {
          console.error('Suggestions failed:', err.message);
          setSuggestions([]);
        }
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, language]);

  // Основная функция поиска с фильтрами
  const applyFilters = useCallback(async () => {
    setLoading(true);
    setSearchActive(true);
    setCurrentPage(1);

    const { type, genre, year, rating, sortBy, animeOnly } = filters;
    const searchQuery = query.trim();

    try {
      // Если есть поисковый запрос, используем search вместо discover
      if (searchQuery) {
        let allResults = [];

        if (type === 'movie' || type === 'all') {
          const movieParams = {
            query: searchQuery,
            language,
            include_adult: false,
            sort_by: getSortField(sortBy, 'movie'),
            ...(genre && { with_genres: genre }),
            ...(year && { primary_release_year: year }),
            ...(rating && { 'vote_average.gte': parseFloat(rating) }),
            ...(animeOnly && { with_genres: genre ? `${genre},16` : '16', with_origin_country: 'JP' })
          };

          const { data, fromCache } = await cachedRequest(
            axios,
            BASE_URL,
            '/search/movie',
            movieParams,
            { Authorization: `Bearer ${AUTH_TOKEN}` },
            CACHE_TTL.SEARCH
          );

          setLastFromCache(fromCache);
          allResults = data.results.map(item => ({ ...item, media_type: 'movie' }));
        }

        if (type === 'tv' || type === 'all') {
          const tvParams = {
            query: searchQuery,
            language,
            include_adult: false,
            sort_by: getSortField(sortBy, 'tv'),
            'vote_count.gte': 10,
            ...(genre && { with_genres: genre }),
            ...(year && { first_air_date_year: year }),
            ...(rating && { 'vote_average.gte': parseFloat(rating) }),
            ...(animeOnly && { with_genres: genre ? `${genre},16` : '16', with_origin_country: 'JP' })
          };

          const { data, fromCache } = await cachedRequest(
            axios,
            BASE_URL,
            '/search/tv',
            tvParams,
            { Authorization: `Bearer ${AUTH_TOKEN}` },
            CACHE_TTL.SEARCH
          );

          setLastFromCache(fromCache);
          const tvResults = data.results.map(item => ({ ...item, media_type: 'tv' }));
          allResults = type === 'all'
            ? [...allResults, ...tvResults]
            : tvResults;
        }

        // Сортируем смешанные результаты
        if (type === 'all') {
          allResults = sortResults(allResults, sortBy);
        }

        setResults(allResults);
      } else {
        // Базовые параметры для фильмов
        const movieParams = {
          language,
          include_adult: false,
          include_video: false,
          sort_by: getSortField(sortBy, 'movie'),
        };

        // Базовые параметры для сериалов
        const tvParams = {
          language,
          include_adult: false,
          include_video: false,
          sort_by: getSortField(sortBy, 'tv'),
          'vote_count.gte': 10,
        };

        // Фильтры для фильмов
        const movieFilters = {};
        if (genre) movieFilters.with_genres = genre;
        if (year) movieFilters.primary_release_year = year;
        if (rating) movieFilters['vote_average.gte'] = parseFloat(rating);
        if (animeOnly) {
          const currentGenre = movieFilters.with_genres;
          movieFilters.with_genres = currentGenre
            ? `${currentGenre},16`
            : '16';
          movieFilters.with_origin_country = 'JP';
        }

        // Фильтры для сериалов
        const tvFilters = {};
        if (genre) tvFilters.with_genres = genre;
        if (year) tvFilters.first_air_date_year = year;
        if (rating) tvFilters['vote_average.gte'] = parseFloat(rating);
        if (animeOnly) {
          const currentGenre = tvFilters.with_genres;
          tvFilters.with_genres = currentGenre
            ? `${currentGenre},16`
            : '16';
          tvFilters.with_origin_country = 'JP';
        }

        // Функция для получения страниц с кэшированием (максимум 20 страниц = 400 результатов)
        const fetchPages = async (endpoint, params, pagesCount = 20) => {
          const allResults = [];

          for (let page = 1; page <= pagesCount; page++) {
            const { data, fromCache } = await cachedRequest(
              axios,
              BASE_URL,
              endpoint,
              { ...params, page },
              { Authorization: `Bearer ${AUTH_TOKEN}` },
              CACHE_TTL.DISCOVER
            );

            if (page === 1) setLastFromCache(fromCache);

            if (data.results && data.results.length > 0) {
              allResults.push(...data.results);
            }

            // Останавливаемся если страница пустая
            if (!data.results || data.results.length < 20) break;
          }

          return allResults;
        };

        let allResults = [];

        // Определяем какие запросы делать
        if (type === 'movie') {
          allResults = await fetchPages('/discover/movie', { ...movieParams, ...movieFilters });
          allResults = allResults.map(item => ({ ...item, media_type: 'movie' }));
        }
        else if (type === 'tv') {
          allResults = await fetchPages('/discover/tv', { ...tvParams, ...tvFilters });
          allResults = allResults.map(item => ({ ...item, media_type: 'tv' }));
        }
        else if (type === 'all') {
          const [movieResults, tvResults] = await Promise.all([
            fetchPages('/discover/movie', { ...movieParams, ...movieFilters }),
            fetchPages('/discover/tv', { ...tvParams, ...tvFilters })
          ]);
          allResults = [
            ...movieResults.map(item => ({ ...item, media_type: 'movie' })),
            ...tvResults.map(item => ({ ...item, media_type: 'tv' }))
          ];
          // Сортируем смешанные результаты
          allResults = sortResults(allResults, sortBy);
        }

        setResults(allResults);
      }
    } catch (err) {
      console.error('Filter search failed:', err.message);
      setResults([]);
    }

    setLoading(false);
  }, [filters, language, query]);

  // Поиск по тексту
  const searchByText = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearchActive(true);
    setCurrentPage(1);
    setSuggestions([]);

    try {
      const { data } = await axios.get(`${BASE_URL}/search/multi`, {
        params: { query: searchQuery, language },
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });

      const filtered = data.results.filter(
        item => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
      );

      setResults(filtered);
    } catch (err) {
      console.error('Text search failed:', err.message);
      setResults([]);
    }

    setLoading(false);
  }, [language]);

  // Клик по подсказке
  const handleSuggestionClick = useCallback((title) => {
    setQuery(title);
    searchByText(title);
    setSuggestions([]);
  }, [searchByText]);

  // Проверка активных фильтров
  const hasActiveFilters = useCallback(() => {
    return (
      filters.genre !== '' ||
      filters.year !== '' ||
      filters.rating !== '' ||
      filters.type !== 'all' ||
      filters.sortBy !== 'popularity.desc' ||
      filters.animeOnly === true
    );
  }, [filters]);

  // Перезапрос результатов при смене языка
  useEffect(() => {
    if (searchActive && results.length > 0) {
      // Очищаем кеш чтобы получить данные с правильными изображениями
      const { clearAllCache } = require('../utils/cache');
      clearAllCache();
      applyFilters();
    }
  }, [language]);

  // Сброс поиска
  const resetSearch = useCallback(() => {
    setQuery('');
    setSearchActive(false);
    setResults([]);
    setCurrentPage(1);
    setFilters({
      type: 'all',
      genre: '',
      year: '',
      rating: '',
      sortBy: 'popularity.desc',
      animeOnly: false
    });
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    results,
    loading,
    searchActive,
    setSearchActive,
    filters,
    setFilters,
    genres,
    loadingGenres,
    currentPage,
    setCurrentPage,
    lastFromCache,
    applyFilters,
    searchByText,
    handleSuggestionClick,
    hasActiveFilters: hasActiveFilters(),
    resetSearch
  };
};

export default useSearch;
