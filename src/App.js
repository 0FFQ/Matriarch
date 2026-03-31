import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import TrailerPlayer from './components/TrailerPlayer';
import InteractiveAtom from './components/InteractiveAtom';
import MenuToggle from './components/MenuToggle';
import Sidebar from './components/Sidebar';
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
  const debounceRef = useRef(null);

  // Инициализация темы
  useEffect(() => {
    document.body.classList.add('dark');
    return () => document.body.classList.remove('dark', 'light');
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

  // Сброс состояния при очистке поиска
  useEffect(() => {
    if (!query && searchActive) {
      setSearchActive(false);
      setResults([]);
      setCurrentMovie(null);
      setSelectedTrailer(null);
      setNoTrailer(false);
    }
  }, [query, searchActive]);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(newDarkMode ? 'dark' : 'light');
  };

  const searchMovies = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setSuggestions([]);
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

  const handleSuggestionClick = (title) => {
    searchMovies(title);
    setSearchActive(true);
    setSuggestions([]);
  };

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
                <p>К сожалению, для фильма «{currentMovie.title}» ({currentMovie.year}) трейлер не найден.</p>
                <a
                  href={`https://www.kinopoisk.ru/search/?query=${encodeURIComponent(`${currentMovie.title} ${currentMovie.year} ${currentMovie.type === 'tv' ? 'сериал' : 'фильм'}`)}`}
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
        {searchActive && results.length > 0 && !selectedTrailer && (
          <ResultsList results={results} imageBase={IMAGE_BASE} onSelect={getTrailer} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTrailer && (
          <TrailerPlayer trailer={selectedTrailer} onClose={() => setSelectedTrailer(null)} setSearchActive={setSearchActive} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
