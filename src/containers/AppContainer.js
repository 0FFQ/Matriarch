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
import SocialIntegration from '../components/messenger/SocialIntegration';
import SearchAndResults from '../components/search/SearchAndResults';
import TrailerSection from '../components/player/TrailerSection';
import MessengerSection from '../components/messenger/MessengerSection';


const AppContainer = () => {
  
  const { firebaseUser } = useUser();

  
  const themeLanguage = useThemeLanguage();

  
  const search = useSearch(themeLanguage.language);

  
  const messenger = useMessenger();

  
  const trailer = useTrailer(search.results, themeLanguage.language);

  
  const appState = useAppState();

  
  useKeyboardShortcuts({
    onCloseTrailer: trailer.closeTrailer,
    onCloseNoTrailer: trailer.closeNoTrailer,
    onCloseProfile: appState.closeProfile,
    onCloseFilter: appState.closeFilter,
    onCloseMenu: appState.closeMenu
  });

  
  const socialIntegration = useSocialIntegration(messenger, search);

  
  const trailerControls = useTrailerControls(trailer, search);

  
  const pagination = usePaginationControls(
    search.results.length,
    ITEMS_PER_PAGE,
    search.currentPage,
    search.setCurrentPage
  );

  
  const showAtom = !search.searchActive || (search.results.length === 0 && !search.loading);

  return (
    <div className={`app ${themeLanguage.darkMode ? 'dark' : 'light'}`}>
      {}
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
        atomVisible={appState.atomVisible}
        onToggleAtom={appState.toggleAtom}
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

      {}
      <SocialIntegration
        messenger={messenger}
        onSelectSharedContent={socialIntegration.handleSelectSharedContent}
        t={themeLanguage.t}
      />

      {}
      <SearchAndResults
        search={search}
        pagination={pagination}
        trailerControls={trailerControls}
        socialHandlers={socialIntegration}
        language={themeLanguage.language}
        filterOpen={appState.filterOpen}
        toggleFilter={appState.toggleFilter}
        resetSearch={search.resetSearch}
        t={themeLanguage.t}
      />

      {}
      <TrailerSection
        trailer={trailer}
        controls={trailerControls}
        setSearchActive={search.setSearchActive}
        t={themeLanguage.t}
      />

      {}
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
