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
import { Loader2 } from 'lucide-react';
import './App.css';

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5YWY0MzRlNWZjNDk1N2I0OTlkZWMzY2FhZmNjYjk2ZCIsIm5iZiI6MTc1NjcyNjgwNC44ODgsInN1YiI6IjY4YjU4NjE0YjQ3NWQ5NjJlMTllMjA4NyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.oAfRNRh81PD-viu5rMg4ubRtcQfBK45Mt6RpUy3DSNk';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [noTrailer, setNoTrailer] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    genre: '',
    yearFrom: '',
    yearTo: '',
    rating: '',
    sortBy: 'popularity.desc',
    animeOnly: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const debounceRef = useRef(null);

  // Инициализация темы
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
            params: { language: 'ru-RU' },
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
          }),
          axios.get(`${BASE_URL}/genre/tv/list`, {
            params: { language: 'ru-RU' },
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
          })
        ]);
        // Объединяем жанры, убираем дубликаты
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
  }, []);

  // Поиск подсказок с debounce 300ms
  useEffect(() => {
    if (query.length > 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await axios.get(`${BASE_URL}/search/multi`, {
            params: { query, language: 'ru-RU' },
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
  }, [query]);

  // Сброс состояния при очистке поиска (только если был текстовый запрос)
  useEffect(() => {
    // Не сбрасываем, если результаты получены через фильтры (без query)
    if (!query && searchActive && results.length === 0) {
      setSearchActive(false);
      setCurrentMovie(null);
      setSelectedTrailer(null);
      setNoTrailer(false);
    }
  }, [query, searchActive, results.length]);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(newDarkMode ? 'dark' : 'light');
  };

  // Поиск через /discover с фильтрами
  const searchWithFilters = useCallback(async (searchFilters) => {
    setLoading(true);
    setSearchActive(true);
    
    const { type, genre, yearFrom, yearTo, rating, sortBy, animeOnly } = searchFilters;
    
    try {
      let endpoint = '/discover/movie';
      const params = {
        language: 'ru-RU',
        sort_by: sortBy,
        include_adult: false,
        include_video: false,
        page: 1
      };

      // Фильтры
      if (genre) params.with_genres = genre;
      if (yearFrom) params.primary_release_year = yearFrom;
      if (rating) params['vote_average.gte'] = parseFloat(rating);
      if (yearFrom && yearTo && yearFrom !== yearTo) {
        params['primary_release_date.gte'] = `${yearFrom}-01-01`;
        params['primary_release_date.lte'] = `${yearTo}-12-31`;
        delete params.primary_release_year;
      }
      
      // Фильтр аниме (Япония + Анимация)
      if (animeOnly) {
        params.with_genres = params.with_genres 
          ? `${params.with_genres},16` 
          : '16';
        params.with_origin_country = 'JP';
      }

      // Если тип 'tv' или 'all'
      if (type === 'tv') {
        endpoint = '/discover/tv';
        params['vote_count.gte'] = 10; // Для сериалов нужен мин. счетчик голосов
      } else if (type === 'all') {
        // Для "все" делаем два запроса и объединяем
        const [movieRes, tvRes] = await Promise.all([
          axios.get(`${BASE_URL}/discover/movie`, { params, headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }),
          axios.get(`${BASE_URL}/discover/tv`, { 
            params: { ...params, 'vote_count.gte': 10 }, 
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` } 
          })
        ]);
        
        const combined = [
          ...movieRes.data.results.map(r => ({ ...r, media_type: 'movie' })),
          ...tvRes.data.results.map(r => ({ ...r, media_type: 'tv' }))
        ];
        
        // Сортируем по выбранному параметру
        const sortKey = sortBy.split('.')[0];
        const sortOrder = sortBy.split('.')[1];
        combined.sort((a, b) => {
          let comparison = 0;
          if (sortKey === 'popularity' || sortKey === 'vote_average') {
            comparison = b[sortKey] - a[sortKey];
          } else if (sortKey === 'primary_release_date') {
            comparison = new Date(b[sortKey]) - new Date(a[sortKey]);
          } else if (sortKey === 'title') {
            comparison = (b.title || b.name || '').localeCompare(a.title || a.name || '', 'ru');
          }
          return sortOrder === 'asc' ? -comparison : comparison;
        });
        
        setResults(combined);
        setLoading(false);
        return;
      }

      const { data } = await axios.get(`${BASE_URL}${endpoint}`, {
        params,
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      
      setResults(data.results.map(r => ({ ...r, media_type: type })));
      setCurrentPage(1); // Сброс на первую страницу при новом поиске
    } catch (err) {
      console.error('Discover search failed:', err.message);
    }
    setLoading(false);
  }, []);

  const searchMovies = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setSuggestions([]);
    setSearchActive(true);
    setCurrentPage(1); // Сброс на первую страницу
    try {
      const { data } = await axios.get(`${BASE_URL}/search/multi`, {
        params: { query: q, language: 'ru-RU' },
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      setResults(data.results.filter(
        item => item.media_type === 'movie' || item.media_type === 'tv'
      ));
    } catch (err) {
      console.error('Search failed:', err.message);
    }
    setLoading(false);
  }, []);

  const handleSuggestionClick = useCallback((title) => {
    searchMovies(title);
    setSuggestions([]);
  }, [searchMovies]);

  // Пагинация
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return results.slice(start, end);
  }, [results, currentPage]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  // Проверка активных фильтров
  const hasActiveFilters = useCallback(() => {
    return (
      filters.genre !== '' ||
      filters.yearFrom !== '' ||
      filters.yearTo !== '' ||
      filters.rating !== '' ||
      filters.type !== 'all' ||
      filters.sortBy !== 'popularity.desc' ||
      filters.animeOnly === true
    );
  }, [filters]);

  // Применение фильтров
  const handleApplyFilters = useCallback((appliedFilters) => {
    searchWithFilters(appliedFilters);
  }, [searchWithFilters]);

  const getTrailer = async (id, type = 'movie') => {
    try {
      const { data } = await axios.get(`${BASE_URL}/${type}/${id}/videos`, {
        params: { language: 'ru-RU' },
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      const trailer = data.results.find(
        v => v.site === 'YouTube' && ['Trailer', 'Teaser', 'Clip'].includes(v.type)
      );
      if (trailer) {
        setSelectedTrailer({ key: trailer.key, title: trailer.name });
      } else {
        const movie = results.find(m => m.id === id);
        setCurrentMovie({
          title: movie?.title || movie?.name || 'Фильм',
          year: (movie?.release_date || movie?.first_air_date || '').split('-')[0],
          type: movie?.media_type || type
        });
        setNoTrailer(true);
      }
    } catch (err) {
      setNoTrailer(true);
    }
  };

  const showAtom = !searchActive || (!results.length && !query);

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <MenuToggle isOpen={menuOpen} onClick={() => setMenuOpen(!menuOpen)} />
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}
      <Sidebar
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />
      <FilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onApply={handleApplyFilters}
        genres={genres}
        loadingGenres={loadingGenres}
      />

      {showAtom && <InteractiveAtom />}

      <motion.div className="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <AnimatePresence mode="wait">
          <SearchBar
            key="search"
            query={query}
            setQuery={setQuery}
            onSearch={searchMovies}
            searchActive={searchActive}
            setSearchActive={setSearchActive}
            loading={loading}
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            onFilterClick={() => setFilterOpen(true)}
            hasActiveFilters={hasActiveFilters()}
          />
        </AnimatePresence>

        {loading && (
          <motion.div className="loading" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Loader2 className="spin" size={48} />
          </motion.div>
        )}

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
                <h2>Трейлер не найден</h2>
                <p>К сожалению, трейлер для «{currentMovie.title}» не найден.</p>
                <a
                  href={`https://www.kinopoisk.ru/search/?query=${encodeURIComponent(`${currentMovie.title} ${currentMovie.year}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kinopoisk-widget-btn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h2v8H8V8zm4 0h2v8h-2V8zm4 0h-2v8h2V8z"/>
                  </svg>
                  <span>На Кинопоиске</span>
                </a>
                <button className="close-widget" onClick={() => setNoTrailer(false)}>✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {searchActive && paginatedResults.length > 0 && !selectedTrailer && (
          <ResultsList results={paginatedResults} imageBase={IMAGE_BASE} onSelect={getTrailer} />
        )}
      </AnimatePresence>

      {/* Пагинация - две прозрачные кнопки по половинам экрана */}
      {searchActive && results.length > ITEMS_PER_PAGE && (
        <>
          {/* Левая половина экрана - скролл влево */}
          <button
            className="page-nav-full page-nav-left"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          
          {/* Правая половина экрана - скролл вправо */}
          <button
            className="page-nav-full page-nav-right"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
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
    </div>
  );
}

export default App;
