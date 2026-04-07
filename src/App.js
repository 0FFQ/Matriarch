import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';
import TrailerPlayer from './components/TrailerPlayer';
import InteractiveAtom from './components/InteractiveAtom';
import MenuToggle from './components/MenuToggle';
import Sidebar from './components/Sidebar';
import FilterPanel from './components/FilterPanel';
import UserProfile from './components/UserProfile';
import SocialFeatures from './components/SocialFeatures';
import MessengerButton from './components/MessengerButton';
import ShareToChatModal from './components/ShareToChatModal';
import PaginationControls from './components/PaginationControls';
import { UserProvider, useUser } from './context/UserContext';
import { cachedRequest, getCacheStats, clearAllCache } from './utils/cache';
import { AUTH_TOKEN, BASE_URL, IMAGE_BASE, ITEMS_PER_PAGE, CACHE_TTL } from './constants';
import { getSortField, sortResults } from './utils/searchUtils';
import useThemeLanguage from './hooks/useThemeLanguage';
import useSearch from './hooks/useSearch';
import useMessenger from './hooks/useMessenger';
import './App.css';

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

function AppContent() {
  // Получаем firebaseUser из UserContext
  const { firebaseUser } = useUser();

  // Хук для управления темой и языком
  const {
    darkMode,
    language,
    t,
    toggleTheme,
    toggleLanguage
  } = useThemeLanguage();

  // Хук для управления поиском
  const {
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
    hasActiveFilters,
    resetSearch
  } = useSearch(language);

  // Хук для управления мессенджером
  const messenger = useMessenger();

  // Состояние трейлера
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [noTrailer, setNoTrailer] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);

  // Состояние UI
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Кэширование
  const [cacheStats, setCacheStats] = useState(null);

  const ITEMS_PER_PAGE_LOCAL = ITEMS_PER_PAGE;

  // === Инициализация ===

  // Обработка клавиши Escape для всех модальных окон
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (selectedTrailer) setSelectedTrailer(null);
        if (noTrailer) setNoTrailer(false);
        if (profileOpen) setProfileOpen(false);
        if (filterOpen) setFilterOpen(false);
        if (menuOpen) setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedTrailer, noTrailer, profileOpen, filterOpen, menuOpen]);

  // Инициализация статистики кэша
  useEffect(() => {
    setCacheStats(getCacheStats());
  }, []);

  const handleClearCache = () => {
    clearAllCache();
    setCacheStats(getCacheStats());
  };

  // === Пагинация ===
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE_LOCAL);

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE_LOCAL;
    const end = start + ITEMS_PER_PAGE_LOCAL;
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
      const { data, fromCache } = await cachedRequest(
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
  };

  // Деструктурируем messenger
  const {
    chatOpen,
    setChatOpen,
    chatListOpen,
    setChatListOpen,
    activeChatId,
    setActiveChatId,
    activeChatUser,
    setActiveChatUser,
    usersOpen,
    setUsersOpen,
    viewingUserId,
    setViewingUserId,
    viewingUserProfile,
    setViewingUserProfile,
    sharedContentOpen,
    setSharedContentOpen,
    shareModalOpen,
    setShareModalOpen,
    shareContentItem,
    setShareContentItem,
    notificationsOpen,
    setNotificationsOpen,
    unreadChats,
    setUnreadChats,
    unreadNotifications,
    setUnreadNotifications,
    shareToChatOpen,
    setShareToChatOpen,
    shareToChatContent,
    setShareToChatContent
  } = messenger;

  // === Рендер ===
  const showAtom = !searchActive || (results.length === 0 && !loading);

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
        <MenuToggle isOpen={menuOpen} onClick={() => setMenuOpen(!menuOpen)} />
        {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}
        {profileOpen && <div className="sidebar-overlay" onClick={() => setProfileOpen(false)} />}
        <Sidebar
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
          language={language}
          onToggleLanguage={toggleLanguage}
          t={t}
          cacheStats={cacheStats}
          onClearCache={handleClearCache}
          onOpenProfile={() => {
            setProfileOpen(true);
            setMenuOpen(false);
          }}
        />

        <UserProfile
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          t={t}
          onBackToMenu={() => {
            setProfileOpen(false);
            setMenuOpen(true);
          }}
        />

      <SocialFeatures
        t={t}
        usersOpen={usersOpen}
        setUsersOpen={setUsersOpen}
        viewingUserId={viewingUserId}
        setViewingUserId={setViewingUserId}
        viewingUserProfile={viewingUserProfile}
        setViewingUserProfile={setViewingUserProfile}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        chatListOpen={chatListOpen}
        setChatListOpen={setChatListOpen}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        activeChatUser={activeChatUser}
        setActiveChatUser={setActiveChatUser}
        sharedContentOpen={sharedContentOpen}
        setSharedContentOpen={setSharedContentOpen}
        shareModalOpen={shareModalOpen}
        setShareModalOpen={setShareModalOpen}
        shareContentItem={shareContentItem}
        setShareContentItem={setShareContentItem}
        notificationsOpen={notificationsOpen}
        setNotificationsOpen={setNotificationsOpen}
        unreadChats={unreadChats}
        setUnreadChats={setUnreadChats}
        unreadNotifications={unreadNotifications}
        setUnreadNotifications={setUnreadNotifications}
        onSelectSharedContent={(content) => {
          // Закрываем чат
          setChatOpen(false);
          setActiveChatId(null);
          setActiveChatUser(null);
          setChatListOpen(true);
          // Ищем фильм по названию
          const title = content.title || '';
          if (title) {
            setQuery(title);
            searchByText(title);
          }
        }}
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
            onFilterClick={() => setFilterOpen(prev => !prev)}
            onHomeClick={resetSearch}
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
          <ResultsList
            results={paginatedResults}
            imageBase={IMAGE_BASE}
            onSelect={getTrailer}
            fromCache={lastFromCache}
            onShareInChat={(item) => {
              setShareToChatContent(item);
              setShareToChatOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

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

      {/* Кнопка мессенджера (отображается только когда пользователь авторизован) */}
      {firebaseUser && (
        <MessengerButton
          onClick={() => {
            setChatListOpen(true);
            setChatOpen(false);
          }}
          unreadCount={unreadChats + unreadNotifications}
        />
      )}

      {/* Модалка шаринга в чат */}
      <ShareToChatModal
        t={t}
        isOpen={shareToChatOpen}
        onClose={() => {
          setShareToChatOpen(false);
          setShareToChatContent(null);
        }}
        contentItem={shareToChatContent}
        onChatOpen={(chatId, user) => {
          setActiveChatId(chatId);
          setActiveChatUser(user);
          setChatOpen(true);
          setChatListOpen(false);
        }}
      />
    </div>
  );
}

export default App;
