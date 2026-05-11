import React from 'react';
import MenuToggle from './common/MenuToggle';
import Sidebar from './Sidebar';
import UserProfile from './user/UserProfile';
import FilterPanel from './search/FilterPanel';
import InteractiveAtom from './common/InteractiveAtom';


const AppLayout = ({
  menuOpen,
  setMenuOpen,
  profileOpen,
  setProfileOpen,
  filterOpen,
  setFilterOpen,
  darkMode,
  onToggleTheme,
  language,
  onToggleLanguage,
  t,
  cacheStats,
  onClearCache,
  atomVisible,
  onToggleAtom,
  showAtom,
  searchProps,
  filterProps
}) => {
  return (
    <>
      <MenuToggle isOpen={menuOpen} onClick={() => setMenuOpen(!menuOpen)} />
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}
      {profileOpen && <div className="sidebar-overlay" onClick={() => setProfileOpen(false)} />}
      
      <Sidebar
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
        language={language}
        onToggleLanguage={onToggleLanguage}
        t={t}
        cacheStats={cacheStats}
        onClearCache={onClearCache}
        onOpenProfile={() => {
          setProfileOpen(true);
          setMenuOpen(false);
        }}
        atomVisible={atomVisible}
        onToggleAtom={onToggleAtom}
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

      <FilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        {...filterProps}
        t={t}
      />

      {showAtom && atomVisible && <InteractiveAtom />}
    </>
  );
};

export default AppLayout;
