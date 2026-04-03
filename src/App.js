import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import TrailerPlayer from './components/TrailerPlayer';
import InteractiveAtom from './components/InteractiveAtom';
import MenuToggle from './components/MenuToggle';
import Sidebar from './components/Sidebar';
import FilterPanel from './components/FilterPanel';
import './App.css';

// Словарь переводов
const translations = {
  'ru-RU': {
    appTitle: 'Matriarch - Поиск фильмов и сериалов онлайн',
    menu: 'Меню',
    settings: 'Настройки',
    lightTheme: 'Светлая тема',
    darkTheme: 'Тёмная тема',
    language: 'Русский',
    filters: 'Фильтры',
    contentType: 'Тип контента',
    all: 'Все',
    movies: 'Фильмы',
    tv: 'Сериалы',
    anime: 'Аниме',
    animeOnly: 'Только аниме (Япония + Анимация)',
    genre: 'Жанр',
    allGenres: 'Все жанры',
    year: 'Год выпуска',
    allYears: 'Все годы',
    rating: 'Минимальный рейтинг',
    sortBy: 'Сортировка',
    byPopularity: 'По популярности',
    byRating: 'По рейтингу',
    byDateNew: 'По дате (новые)',
    byDateOld: 'По дате (старые)',
    byTitleAZ: 'По названию (А-Я)',
    byTitleZA: 'По названию (Я-А)',
    reset: 'Сбросить',
    apply: 'Применить',
    trailerNotFound: 'Трейлер не найден',
    trailerNotFoundText: 'К сожалению, трейлер для «',
    notFound: 'не найден.',
    kinopoisk: 'На Кинопоиске',
    close: 'Закрыть',
    searchPlaceholder: 'Поиск фильмов и сериалов...',
    noResults: 'Ничего не найдено',
    page: 'Страница'
  },
  'en-US': {
    appTitle: 'Matriarch - Movies and TV Shows Search',
    menu: 'Menu',
    settings: 'Settings',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    language: 'English',
    filters: 'Filters',
    contentType: 'Content Type',
    all: 'All',
    movies: 'Movies',
    tv: 'TV Shows',
    anime: 'Anime',
    animeOnly: 'Anime Only (Japan + Animation)',
    genre: 'Genre',
    allGenres: 'All Genres',
    year: 'Release Year',
    allYears: 'All Years',
    rating: 'Minimum Rating',
    sortBy: 'Sort By',
    byPopularity: 'By Popularity',
    byRating: 'By Rating',
    byDateNew: 'By Date (Newest)',
    byDateOld: 'By Date (Oldest)',
    byTitleAZ: 'By Title (A-Z)',
    byTitleZA: 'By Title (Z-A)',
    reset: 'Reset',
    apply: 'Apply',
    trailerNotFound: 'Trailer Not Found',
    trailerNotFoundText: 'Unfortunately, trailer for «',
    notFound: 'not found.',
    kinopoisk: 'On Kinopoisk',
    close: 'Close',
    searchPlaceholder: 'Search movies and TV shows...',
    noResults: 'Nothing found',
    page: 'Page'
  }
};

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5YWY0MzRlNWZjNDk1N2I0OTlkZWMzY2FhZmNjYjk2ZCIsIm5iZiI6MTc1NjcyNjgwNC44ODgsInN1YiI6IjY4YjU4NjE0YjQ3NWQ5NjJlMTllMjA4NyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.oAfRNRh81PD-viu5rMg4ubRtcQfBK45Mt6RpUy3DSNk';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

function App() {
  // Состояние поиска
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Состояние результатов
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  // Состояние трейлера
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [noTrailer, setNoTrailer] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);

  // Состояние UI
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    // Загружаем сохранённый язык из localStorage
    const savedLanguage = localStorage.getItem('matriarch_language');
    return savedLanguage || 'ru-RU';
  }); // 'ru-RU' или 'en-US'

  // Текущие переводы
  const t = useMemo(() => translations[language], [language]);

  // Устанавливаем lang атрибут при инициализации
  useEffect(() => {
    document.documentElement.lang = language;
  }, []);

  // Жанры
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  
  // Фильтры
  const [filters, setFilters] = useState({
    type: 'all',
    genre: '',
    year: '',
    rating: '',
    sortBy: 'popularity.desc',
    animeOnly: false
  });
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  
  const debounceRef = useRef(null);

  // === Инициализация ===

  // Обработка клавиши Escape для всех модальных окон
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (selectedTrailer) setSelectedTrailer(null);
        if (noTrailer) setNoTrailer(false);
        if (filterOpen) setFilterOpen(false);
        if (menuOpen) setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedTrailer, noTrailer, filterOpen, menuOpen]);

  // Тема
  useEffect(() => {
    document.body.classList.add('dark');
    return () => document.body.classList.remove('dark', 'light');
  }, []);

  // Загрузка жанров
  useEffect(() => {
    const loadGenres = async () => {
      setLoadingGenres(true);
      try {
        const [movieGenres, tvGenres] = await Promise.all([
          axios.get(`${BASE_URL}/genre/movie/list`, {
            params: { language },
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
          }),
          axios.get(`${BASE_URL}/genre/tv/list`, {
            params: { language },
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
          })
        ]);
        const allGenres = [...movieGenres.data.genres, ...tvGenres.data.genres];
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

  // === Поиск подсказок ===
  useEffect(() => {
    if (query.length > 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await axios.get(`${BASE_URL}/search/multi`, {
            params: { query, language },
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
          });
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

  // === Переключение темы и языка ===
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(newDarkMode ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'ru-RU' ? 'en-US' : 'ru-RU';
    setLanguage(newLanguage);
    // Сохраняем язык в localStorage
    localStorage.setItem('matriarch_language', newLanguage);
    // Обновляем атрибут lang на документе
    document.documentElement.lang = newLanguage;
  };

  // === Основная функция поиска с фильтрами ===
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
          const { data } = await axios.get(`${BASE_URL}/search/movie`, {
            params: { 
              query: searchQuery,
              language,
              include_adult: false,
              sort_by: getSortField(sortBy, 'movie'),
              ...(genre && { with_genres: genre }),
              ...(year && { primary_release_year: year }),
              ...(rating && { 'vote_average.gte': parseFloat(rating) }),
              ...(animeOnly && { with_genres: genre ? `${genre},16` : '16', with_origin_country: 'JP' })
            },
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
          });
          allResults = data.results.map(item => ({ ...item, media_type: 'movie' }));
        }

        if (type === 'tv' || type === 'all') {
          const { data } = await axios.get(`${BASE_URL}/search/tv`, {
            params: { 
              query: searchQuery,
              language,
              include_adult: false,
              sort_by: getSortField(sortBy, 'tv'),
              'vote_count.gte': 10,
              ...(genre && { with_genres: genre }),
              ...(year && { first_air_date_year: year }),
              ...(rating && { 'vote_average.gte': parseFloat(rating) }),
              ...(animeOnly && { with_genres: genre ? `${genre},16` : '16', with_origin_country: 'JP' })
            },
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
          });
          const tvResults = data.results.map(item => ({ ...item, media_type: 'tv' }));
          allResults = type === 'all' 
            ? [...allResults, ...tvResults]
            : tvResults;
        }

        // Сортируем смешанные результаты
        if (type === 'all') {
          allResults = sortResults(allResults, sortBy);
        }

        // Фильтруем результаты без постеров
        allResults = allResults.filter(item => item.poster_path);
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

        // Функция для получения страниц (максимум 20 страниц = 400 результатов)
        const fetchPages = async (endpoint, params, pagesCount = 20) => {
          const requests = [];
          for (let page = 1; page <= pagesCount; page++) {
            requests.push(
              axios.get(`${BASE_URL}${endpoint}`, {
                params: { ...params, page },
                headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
              })
            );
          }
          const responses = await Promise.all(requests);
          return responses.flatMap(res => res.data.results || []);
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

        // Фильтруем результаты без постеров
        allResults = allResults.filter(item => item.poster_path);
        setResults(allResults);
      }
    } catch (err) {
      console.error('Filter search failed:', err.message);
      setResults([]);
    }

    setLoading(false);
  }, [filters, language, query]);

  // Перезапрос результатов при смене языка (если поиск активен)
  useEffect(() => {
    if (searchActive && results.length > 0) {
      // Обновляем данные на новом языке
      applyFilters();
    }
  }, [language]);

  // === Поиск по тексту ===
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
  }, []);

  // === Клик по подсказке ===
  const handleSuggestionClick = useCallback((title) => {
    setQuery(title);
    searchByText(title);
    setSuggestions([]);
  }, [searchByText]);

  // === Проверка активных фильтров ===
  const hasActiveFilters = useMemo(() => {
    return (
      filters.genre !== '' ||
      filters.year !== '' ||
      filters.rating !== '' ||
      filters.type !== 'all' ||
      filters.sortBy !== 'popularity.desc' ||
      filters.animeOnly === true
    );
  }, [filters]);

  // === Вспомогательные функции ===
  
  const getSortField = (sortBy, type = 'movie') => {
    const field = sortBy.split('.')[0];
    if (type === 'tv' && field === 'primary_release_date') {
      return 'first_air_date';
    }
    if (field === 'title') return 'original_title';
    return field;
  };

  const sortResults = (results, sortBy) => {
    const [field, order] = sortBy.split('.');
    const sorted = [...results].sort((a, b) => {
      if (field === 'popularity' || field === 'vote_average') {
        return order === 'desc' ? b[field] - a[field] : a[field] - b[field];
      }
      if (field === 'primary_release_date') {
        const dateA = new Date(a[field] || 0);
        const dateB = new Date(b[field] || 0);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      }
      if (field === 'title') {
        const titleA = a.title || a.name || '';
        const titleB = b.title || b.name || '';
        return order === 'desc' 
          ? titleB.localeCompare(titleA, 'ru') 
          : titleA.localeCompare(titleB, 'ru');
      }
      return 0;
    });
    return sorted;
  };

  // === Пагинация ===
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return results.slice(start, end);
  }, [results, currentPage]);

  const handlePageChange = useCallback((direction) => {
    if (direction === 'next') {
      setCurrentPage(prev => prev >= totalPages ? 1 : prev + 1);
    } else {
      setCurrentPage(prev => prev <= 1 ? totalPages : prev - 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, totalPages]);

  // === Получение трейлера ===
  const getTrailer = async (id, type = 'movie') => {
    try {
      const { data } = await axios.get(`${BASE_URL}/${type}/${id}/videos`, {
        params: { language },
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });

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
  };

  // === Рендер ===
  const showAtom = !searchActive || (results.length === 0 && !loading);

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <MenuToggle isOpen={menuOpen} onClick={() => setMenuOpen(!menuOpen)} />
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}
      <Sidebar
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        language={language}
        onToggleLanguage={toggleLanguage}
        t={t}
      />
      
      <FilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={applyFilters}
        genres={genres}
        loadingGenres={loadingGenres}
        t={t}
      />

      {showAtom && <InteractiveAtom />}

      <motion.div className="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <AnimatePresence mode="wait">
          <SearchBar
            key="search"
            query={query}
            setQuery={setQuery}
            onSearch={searchByText}
            searchActive={searchActive}
            setSearchActive={setSearchActive}
            loading={loading}
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            onFilterClick={() => setFilterOpen(true)}
            hasActiveFilters={hasActiveFilters}
            language={language}
          />
        </AnimatePresence>
      </motion.div>

      {/* Глобальный индикатор загрузки */}
      {loading && (
        <motion.div
          className="global-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="loading-overlay">
            <div className="loading-spinner-large">
              <div className="spinner-large"></div>
              <p className="loading-text">{language === 'ru-RU' ? 'Загрузка...' : 'Loading...'}</p>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {searchActive && paginatedResults.length > 0 && !selectedTrailer && (
          <ResultsList results={paginatedResults} imageBase={IMAGE_BASE} onSelect={getTrailer} />
        )}
      </AnimatePresence>

      {searchActive && results.length > ITEMS_PER_PAGE && (
        <motion.div
          className="pagination-indicator"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <span className="page-number">{currentPage} / {totalPages}</span>
        </motion.div>
      )}

      {searchActive && results.length > ITEMS_PER_PAGE && (
        <>
          <button className="page-nav-full page-nav-left" onClick={() => handlePageChange('prev')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <button className="page-nav-full page-nav-right" onClick={() => handlePageChange('next')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </>
      )}

      <AnimatePresence>
        {selectedTrailer && (
          <TrailerPlayer trailer={selectedTrailer} onClose={() => setSelectedTrailer(null)} setSearchActive={setSearchActive} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {noTrailer && currentMovie && (
          <motion.div
            className="no-trailer-widget"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNoTrailer(false)}
          >
            <div className="no-trailer-content" onClick={(e) => e.stopPropagation()}>
              <h2>{t.trailerNotFound}</h2>
              <p>{t.trailerNotFoundText}«{currentMovie.title}» {t.notFound}</p>
              <a
                href={`https://www.kinopoisk.ru/search/?query=${encodeURIComponent(`${currentMovie.title} ${currentMovie.year}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="kinopoisk-widget-btn"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h2v8H8V8zm4 0h2v8h-2V8zm4 0h-2v8h2V8z"/>
                </svg>
                <span>{t.kinopoisk}</span>
              </a>
              <button className="close-widget" onClick={() => setNoTrailer(false)}>✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
