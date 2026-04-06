import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { onAuthChange } from "../firebase/auth";
import { saveUserData, loadUserData } from "../firebase/firestore";

const UserContext = createContext(null);

// Ключи для localStorage
const LOCAL_STORAGE_KEYS = {
  profile: "matriarch_profile",
  favorites: "matriarch_favorites",
  watched: "matriarch_watched",
  watchlist: "matriarch_watchlist",
};

// ============================================
// LocalStorage утилиты
// ============================================

/**
 * Загрузить данные из localStorage
 */
const loadFromLocalStorage = () => {
  try {
    return {
      profile: JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_KEYS.profile) ||
          '{"name":"","avatar":""}'
      ),
      favorites: JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_KEYS.favorites) || "[]"
      ),
      watched: JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_KEYS.watched) || "[]"
      ),
      watchlist: JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_KEYS.watchlist) || "[]"
      ),
    };
  } catch {
    return {
      profile: { name: "", avatar: "" },
      favorites: [],
      watched: [],
      watchlist: [],
    };
  }
};

/**
 * Сохранить данные в localStorage
 */
const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.profile,
      JSON.stringify(data.profile)
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.favorites,
      JSON.stringify(data.favorites)
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.watched,
      JSON.stringify(data.watched)
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.watchlist,
      JSON.stringify(data.watchlist)
    );
  } catch (error) {
    console.error("[UserContext] LocalStorage save error:", error);
  }
};

// ============================================
// Провайдер
// ============================================

export const UserProvider = ({ children }) => {
  // Загружаем начальные данные из localStorage
  const initialData = loadFromLocalStorage();

  // Состояние
  const [user, setUser] = useState(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [profile, setProfile] = useState(initialData.profile);
  const [favorites, setFavorites] = useState(initialData.favorites);
  const [watched, setWatched] = useState(initialData.watched);
  const [watchlist, setWatchlist] = useState(initialData.watchlist);

  // Ref для отслеживания загрузки из Firestore
  const isLoadingRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  // ============================================
  // Аутентификация
  // ============================================

  // При изменении состояния аутентификации
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setSyncEnabled(true);

        // Загружаем данные из Firestore
        isLoadingRef.current = true;
        const firestoreData = await loadUserData(firebaseUser.uid);

        if (firestoreData) {
          // Обновляем состояние данными из Firestore
          if (firestoreData.profile) {
            setProfile({
              ...firestoreData.profile,
              email: firebaseUser.email,
            });
          }
          if (firestoreData.favorites)
            setFavorites(firestoreData.favorites);
          if (firestoreData.watched) setWatched(firestoreData.watched);
          if (firestoreData.watchlist)
            setWatchlist(firestoreData.watchlist);
        } else {
          // Первый вход — создаём документ с Google-профилем
          const googleProfile = {
            name: firebaseUser.displayName || "",
            avatar: firebaseUser.photoURL || "",
            email: firebaseUser.email || "",
          };

          setProfile(googleProfile);
          await saveUserData(firebaseUser.uid, {
            profile: googleProfile,
            favorites: [],
            watched: [],
            watchlist: [],
          });
        }

        isLoadingRef.current = false;
      } else {
        console.log("[UserContext] ❌ Logged out");
        setUser(null);
        setSyncEnabled(false);

        // Очищаем localStorage
        try {
          Object.values(LOCAL_STORAGE_KEYS).forEach((key) =>
            localStorage.removeItem(key)
          );
        } catch (error) {
          console.error(
            "[UserContext] LocalStorage clear error:",
            error
          );
        }

        // Сбрасываем состояние
        setProfile({ name: "", avatar: "" });
        setFavorites([]);
        setWatched([]);
        setWatchlist([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // ============================================
  // Синхронизация данных
  // ============================================

  // Сохранение в localStorage (всегда)
  useEffect(() => {
    saveToLocalStorage({ profile, favorites, watched, watchlist });
  }, [profile, favorites, watched, watchlist]);

  // Сохранение в Firestore (только если НЕ загружаем)
  useEffect(() => {
    // НЕ сохраняем если:
    // - Пользователь не авторизован
    // - Идёт загрузка из Firestore
    if (!syncEnabled || !user || isLoadingRef.current) return;

    // Очищаем предыдущий таймер
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce 500ms
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveUserData(user.uid, {
          profile,
          favorites,
          watched,
          watchlist,
        });
      } catch (error) {
        console.error("[UserContext] Save error:", error);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [profile, favorites, watched, watchlist, syncEnabled, user]);

  // ============================================
  // Функции управления списками
  // ============================================

  const updateProfile = useCallback((newProfile) => {
    setProfile(newProfile);
  }, []);

  const toggleFavorite = useCallback((item) => {
    setFavorites((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  const toggleWatched = useCallback((item) => {
    setWatched((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      // Удаляем из watchlist при добавлении в просмотренные
      setWatchlist((wl) => wl.filter((i) => i.id !== item.id));
      return [...prev, { ...item, watchedAt: Date.now() }];
    });
  }, []);

  const toggleWatchlist = useCallback((item) => {
    setWatchlist((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  // Проверки наличия в списках
  const isInFavorites = useCallback(
    (id) => favorites.some((i) => i.id === id),
    [favorites]
  );
  const isInWatched = useCallback(
    (id) => watched.some((i) => i.id === id),
    [watched]
  );
  const isInWatchlist = useCallback(
    (id) => watchlist.some((i) => i.id === id),
    [watchlist]
  );

  // Удаление из списков
  const removeFromFavorites = useCallback((id) => {
    setFavorites((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const removeFromWatched = useCallback((id) => {
    setWatched((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const removeFromWatchlist = useCallback((id) => {
    setWatchlist((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ============================================
  // Контекст
  // ============================================

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
    isAuthenticated: !!user,
    syncEnabled,
    firebaseUser: user,
  };

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
};

// ============================================
// Хук
// ============================================

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;
