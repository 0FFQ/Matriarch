import React from 'react';
import { useUser } from '../context/UserContext';
import { ITEMS_PER_PAGE } from '../constants';
import {
  useThemeLanguage,
  useSearch,
  useMessenger,
  useTrailer,
  useAppState,
  useKeyboardShortcuts,
  useSocialIntegration,
  useTrailerControls,
  usePaginationControls
} from '../hooks';
import AppLayout from '../components/AppLayout';
import SocialIntegration from '../components/SocialIntegration';
import SearchAndResults from '../components/SearchAndResults';
import TrailerSection from '../components/TrailerSection';
import MessengerSection from '../components/MessengerSection';

/**
 * Главный контейнер приложения
 * Объединяет все хуки и компоненты
 */
const AppContainer = () => {
  // Получаем пользователя из контекста
  const { firebaseUser } = useUser();

  // Хук для управления темой и языком
  const themeLanguage = useThemeLanguage();

  // Хук для управления поиском
  const search = useSearch(themeLanguage.language);

  // Хук для управления мессенджером
  const messenger = useMessenger();

  // Хук для управления трейлерами
  const trailer = useTrailer(search.results, themeLanguage.language);

  // Хук для управления состоянием приложения
  const appState = useAppState();

  // Обработка клавиатурных сокращений
  useKeyboardShortcuts({
    onCloseTrailer: trailer.closeTrailer,
    onCloseNoTrailer: trailer.closeNoTrailer,
    onCloseProfile: appState.closeProfile,
    onCloseFilter: appState.closeFilter,
    onCloseMenu: appState.closeMenu
  });

  // Интеграция социальных функций
  const socialIntegration = useSocialIntegration(messenger, search);

  // Управление трейлером
  const trailerControls = useTrailerControls(trailer, search);

  // Управление пагинацией
  const pagination = usePaginationControls(
    search.results.length,
    ITEMS_PER_PAGE,
    search.currentPage,
    search.setCurrentPage
  );

  // Показывать ли атом
  const showAtom = !search.searchActive || (search.results.length === 0 && !search.loading);

  return (
    <div className={`app ${themeLanguage.darkMode ? 'dark' : 'light'}`}>
      {/* Layout */}
      <AppLayout
        menuOpen={appState.menuOpen}
        setMenuOpen={appState.setMenuOpen}
        profileOpen={appState.profileOpen}
        setProfileOpen={appState.setProfileOpen}
        filterOpen={appState.filterOpen}
        setFilterOpen={appState.setFilterOpen}
        darkMode={themeLanguage.darkMode}
        onToggleTheme={themeLanguage.toggleTheme}
        language={themeLanguage.language}
        onToggleLanguage={themeLanguage.toggleLanguage}
        t={themeLanguage.t}
        cacheStats={appState.cacheStats}
        onClearCache={appState.handleClearCache}
        showAtom={showAtom}
        searchProps={search}
        filterProps={{
          filters: search.filters,
          setFilters: search.setFilters,
          onApply: search.applyFilters,
          genres: search.genres,
          loadingGenres: search.loadingGenres
        }}
      />

      {/* Социальная интеграция */}
      <SocialIntegration
        messenger={messenger}
        onSelectSharedContent={socialIntegration.handleSelectSharedContent}
        t={themeLanguage.t}
      />

      {/* Поиск и результаты */}
      <SearchAndResults
        search={search}
        pagination={pagination}
        trailerControls={trailerControls}
        socialHandlers={socialIntegration}
        language={themeLanguage.language}
        filterOpen={appState.filterOpen}
        toggleFilter={appState.toggleFilter}
        resetSearch={search.resetSearch}
      />

      {/* Трейлер */}
      <TrailerSection
        trailer={trailer}
        controls={trailerControls}
        setSearchActive={search.setSearchActive}
        t={themeLanguage.t}
      />

      {/* Мессенджер */}
      <MessengerSection
        firebaseUser={firebaseUser}
        messenger={messenger}
        controls={{
          handleOpenMessenger: socialIntegration.handleOpenMessenger,
          handleCloseShareModal: socialIntegration.handleCloseShareModal,
          handleOpenChatFromShare: socialIntegration.handleOpenChatFromShare
        }}
        t={themeLanguage.t}
      />
    </div>
  );
};

export default AppContainer;
