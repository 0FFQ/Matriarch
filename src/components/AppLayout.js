import React from 'react';
import MenuToggle from './common/MenuToggle';
import Sidebar from './Sidebar';
import UserProfile from './user/UserProfile';
import FilterPanel from './search/FilterPanel';
import InteractiveAtom from './common/InteractiveAtom';

/**
 * Компонент основной структуры приложения
 * @param {boolean} menuOpen - открыто ли меню
 * @param {function} setMenuOpen - функция управления меню
 * @param {boolean} profileOpen - открыт ли профиль
 * @param {function} setProfileOpen - функция управления профилем
 * @param {boolean} filterOpen - открыт ли фильтр
 * @param {function} setFilterOpen - функция управления фильтром
 * @param {boolean} darkMode - тёмная тема
 * @param {function} onToggleTheme - переключение темы
 * @param {string} language - текущий язык
 * @param {function} onToggleLanguage - переключение языка
 * @param {Object} t - объект с переводами
 * @param {Object} cacheStats - статистика кэша
 * @param {function} onClearCache - очистка кэша
 * @param {boolean} atomVisible - видимость атома
 * @param {function} onToggleAtom - переключение видимости атома
 * @param {boolean} showAtom - показывать ли атом
 * @param {Object} searchProps - пропсы для поиска
 * @param {Object} filterProps - пропсы для фильтра
 */
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
