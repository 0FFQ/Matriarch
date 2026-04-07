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

  return {
    menuOpen,
    setMenuOpen,
    profileOpen,
    setProfileOpen,
    filterOpen,
    setFilterOpen,
    cacheStats,
    toggleMenu,
    closeMenu,
    openProfile,
    closeProfile,
    backToMenu,
    toggleFilter,
    closeFilter,
    handleClearCache
  };
};

export default useAppState;
