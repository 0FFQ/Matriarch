import { useState, useCallback, useEffect } from 'react';
import { getCacheStats, clearAllCache } from '../utils/cache';

/**
 * Кастомный хук для управления общим состоянием приложения
 * @returns {Object} состояние и функции для управления UI
 */
const useAppState = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);
  const [atomVisible, setAtomVisible] = useState(() => {
    const saved = localStorage.getItem('matriarch_atom_visible');
    return saved !== null ? saved === 'true' : true;
  });

  // Обёртка для сохранения в localStorage при прямом вызове setAtomVisible
  const setAtomVisibleWithSave = useCallback((value) => {
    setAtomVisible(prev => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('matriarch_atom_visible', newValue.toString());
      return newValue;
    });
  }, []);

  // Инициализация статистики кэша
  useEffect(() => {
    setCacheStats(getCacheStats());
  }, []);

  const handleClearCache = useCallback(() => {
    clearAllCache();
    setCacheStats(getCacheStats());
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const openProfile = useCallback(() => {
    setProfileOpen(true);
    setMenuOpen(false);
  }, []);

  const closeProfile = useCallback(() => {
    setProfileOpen(false);
  }, []);

  const backToMenu = useCallback(() => {
    setProfileOpen(false);
    setMenuOpen(true);
  }, []);

  const toggleFilter = useCallback(() => {
    setFilterOpen(prev => !prev);
  }, []);

  const closeFilter = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const toggleAtom = useCallback(() => {
    setAtomVisible(prev => {
      const newValue = !prev;
      localStorage.setItem('matriarch_atom_visible', newValue.toString());
      return newValue;
    });
  }, []);

  return {
    menuOpen,
    setMenuOpen,
    profileOpen,
    setProfileOpen,
    filterOpen,
    setFilterOpen,
    cacheStats,
    atomVisible,
    setAtomVisible: setAtomVisibleWithSave,
    toggleMenu,
    closeMenu,
    openProfile,
    closeProfile,
    backToMenu,
    toggleFilter,
    closeFilter,
    handleClearCache,
    toggleAtom
  };
};

export default useAppState;
