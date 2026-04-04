import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthChange } from '../firebase/auth';
import { saveUserData, loadUserData, subscribeToUserData } from '../firebase/firestore';

const UserContext = createContext(null);

const LOCAL_STORAGE_KEYS = {
  profile: 'matriarch_profile',
  favorites: 'matriarch_favorites',
  watched: 'matriarch_watched',
  watchlist: 'matriarch_watchlist',
};

/**
 * Загрузить данные из localStorage (fallback)
 */
const loadFromLocalStorage = () => {
  try {
    return {
      profile: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.profile) || '{"name":"","avatar":""}'),
      favorites: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.favorites) || '[]'),
      watched: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.watched) || '[]'),
      watchlist: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.watchlist) || '[]'),
    };
  } catch {
    return {
      profile: { name: '', avatar: '' },
      favorites: [],
      watched: [],
      watchlist: [],
    };
  }
};

/**
 * Сохранить данные в localStorage (fallback)
 */
const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.profile, JSON.stringify(data.profile));
    localStorage.setItem(LOCAL_STORAGE_KEYS.favorites, JSON.stringify(data.favorites));
    localStorage.setItem(LOCAL_STORAGE_KEYS.watched, JSON.stringify(data.watched));
    localStorage.setItem(LOCAL_STORAGE_KEYS.watchlist, JSON.stringify(data.watchlist));
  } catch (error) {
    console.error('[UserContext] LocalStorage save error:', error);
  }
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase user
  const [syncEnabled, setSyncEnabled] = useState(false);
  const unsubscribeRef = useRef(null);
  
  // Ссылка для предотвращения бесконечного цикла
  // Храним последний snapshot данных из Firestore
  const lastFirestoreSnapshotRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Загружаем данные из localStorage по умолчанию
  const initialData = loadFromLocalStorage();

  const [profile, setProfile] = useState(initialData.profile);
  const [favorites, setFavorites] = useState(initialData.favorites);
  const [watched, setWatched] = useState(initialData.watched);
  const [watchlist, setWatchlist] = useState(initialData.watchlist);

  // Функция для создания хэша данных
  const createDataSnapshot = useCallback((data) => {
    return JSON.stringify({
      profile: data.profile,
      favorites: data.favorites,
      watched: data.watched,
      watchlist: data.watchlist,
    });
  }, []);

  // Следим за состоянием аутентификации
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[UserContext] ✅ User authenticated:', firebaseUser.email);
        setUser(firebaseUser);
        setSyncEnabled(true);

        // Загружаем данные из Firestore или инициализируем
        const firestoreData = await loadUserData(firebaseUser.uid);
        
        if (firestoreData) {
          console.log('[UserContext] 📥 Data loaded from Firestore');
          // Сохраняем snapshot чтобы не сохранять обратно
          lastFirestoreSnapshotRef.current = createDataSnapshot(firestoreData);
          
          if (firestoreData.profile) setProfile(firestoreData.profile);
          if (firestoreData.favorites) setFavorites(firestoreData.favorites);
          if (firestoreData.watched) setWatched(firestoreData.watched);
          if (firestoreData.watchlist) setWatchlist(firestoreData.watchlist);
        } else {
          // Первый вход - инициализируем ВСЕМИ данными из localStorage
          console.log('[UserContext] 🆕 First login, initializing Firestore from localStorage');
          const localData = loadFromLocalStorage();
          lastFirestoreSnapshotRef.current = createDataSnapshot(localData);
          
          await saveUserData(firebaseUser.uid, localData);
          console.log('[UserContext] ✅ Firestore initialized from localStorage');
        }

        // Подписываемся на real-time обновления
        unsubscribeRef.current = subscribeToUserData(firebaseUser.uid, (data) => {
          console.log('[UserContext] 🔄 Real-time sync update from Firestore');
          // Сохраняем snapshot чтобы не сохранять обратно
          lastFirestoreSnapshotRef.current = createDataSnapshot(data);
          
          if (data.profile) setProfile(data.profile);
          if (data.favorites) setFavorites(data.favorites);
          if (data.watched) setWatched(data.watched);
          if (data.watchlist) setWatchlist(data.watchlist);
        });
      } else {
        console.log('[UserContext] ❌ User logged out');
        setUser(null);
        setSyncEnabled(false);
        lastFirestoreSnapshotRef.current = null;
        
        // Отписываемся от Firestore
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
          console.log('[UserContext] Unsubscribed from Firestore');
        }

        // НЕ загружаем localStorage при выходе - оставляем текущие state
        // Это предотвращает лишний rerender
      }
    });

    return () => {
      console.log('[UserContext] Cleanup: unsubscribing from auth');
      unsubscribe();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      // Очищаем таймер
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [createDataSnapshot]);

  // Сохранение в localStorage (всегда)
  useEffect(() => {
    saveToLocalStorage({ profile, favorites, watched, watchlist });
  }, [profile, favorites, watched, watchlist]);

  // Сохранение в Firestore (только при локальных изменениях)
  useEffect(() => {
    if (!syncEnabled || !user) return;
    
    const currentSnapshot = createDataSnapshot({ profile, favorites, watched, watchlist });
    
    // Если snapshot совпадает с последним из Firestore - не сохраняем
    if (lastFirestoreSnapshotRef.current === currentSnapshot) {
      return;
    }
    
    // Debounce: ждём 500мс перед сохранением
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      console.log('[UserContext] Saving to Firestore (local change)');
      lastFirestoreSnapshotRef.current = currentSnapshot; // Обновляем snapshot
      saveUserData(user.uid, { profile, favorites, watched, watchlist }).catch(error => {
        console.error('[UserContext] Firestore save error:', error);
      });
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [profile, favorites, watched, watchlist, syncEnabled, user, createDataSnapshot]);

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
    // Firebase sync info
    isAuthenticated: !!user,
    syncEnabled,
    firebaseUser: user,
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
