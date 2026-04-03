import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UserContext = createContext(null);

const LOCAL_STORAGE_KEYS = {
  profile: 'matriarch_profile',
  favorites: 'matriarch_favorites',
  watched: 'matriarch_watched',
  watchlist: 'matriarch_watchlist',
};

export const UserProvider = ({ children }) => {
  // Профиль пользователя
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.profile);
      return saved ? JSON.parse(saved) : { name: '', avatar: '' };
    } catch {
      return { name: '', avatar: '' };
    }
  });

  // Избранное
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.favorites);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Просмотренное
  const [watched, setWatched] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.watched);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Буду смотреть
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.watchlist);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Сохранение профиля
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.profile, JSON.stringify(profile));
  }, [profile]);

  // Сохранение избранного
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites]);

  // Сохранение просмотренного
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.watched, JSON.stringify(watched));
  }, [watched]);

  // Сохранение списка "Буду смотреть"
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.watchlist, JSON.stringify(watchlist));
  }, [watchlist]);

  // Обновление профиля
  const updateProfile = useCallback((newProfile) => {
    setProfile(newProfile);
  }, []);

  // Добавление/удаление из избранного
  const toggleFavorite = useCallback((item) => {
    setFavorites(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  // Добавление/удаление из просмотренного
  const toggleWatched = useCallback((item) => {
    setWatched(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      // Удаляем из watchlist если добавляем в watched
      setWatchlist(wl => wl.filter(i => i.id !== item.id));
      return [...prev, { ...item, watchedAt: Date.now() }];
    });
  }, []);

  // Добавление/удаление в "Буду смотреть"
  const toggleWatchlist = useCallback((item) => {
    setWatchlist(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  // Проверка, находится ли элемент в списке
  const isInFavorites = useCallback((id) => favorites.some(i => i.id === id), [favorites]);
  const isInWatched = useCallback((id) => watched.some(i => i.id === id), [watched]);
  const isInWatchlist = useCallback((id) => watchlist.some(i => i.id === id), [watchlist]);

  // Удаление из конкретного списка (для страницы профиля)
  const removeFromFavorites = useCallback((id) => {
    setFavorites(prev => prev.filter(i => i.id !== id));
  }, []);

  const removeFromWatched = useCallback((id) => {
    setWatched(prev => prev.filter(i => i.id !== id));
  }, []);

  const removeFromWatchlist = useCallback((id) => {
    setWatchlist(prev => prev.filter(i => i.id !== id));
  }, []);

  const value = {
    profile,
    updateProfile,
    favorites,
    watched,
    watchlist,
    toggleFavorite,
    toggleWatched,
    toggleWatchlist,
    isInFavorites,
    isInWatched,
    isInWatchlist,
    removeFromFavorites,
    removeFromWatched,
    removeFromWatchlist,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
