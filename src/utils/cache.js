/**
 * Утилита кэширования для TMDB API
 * Поддерживает TTL, localStorage и автоматическую очистку
 */

const CACHE_PREFIX = 'matriarch_cache_';
const DEFAULT_TTL = 1000 * 60 * 30; // 30 минут

/**
 * Создать ключ кэша из параметров
 */
const createCacheKey = (endpoint, params = {}) => {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${CACHE_PREFIX}${endpoint}?${paramString}`;
};

/**
 * Получить данные из кэша
 * @returns {object|null} Данные или null если кэш истёк/не найден
 */
export const getCache = (endpoint, params = {}) => {
  try {
    const key = createCacheKey(endpoint, params);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const { data, timestamp, ttl } = JSON.parse(cached);
    const now = Date.now();
    
    // Проверяем TTL
    if (now - timestamp > ttl) {
      // Кэш истёк, удаляем
      localStorage.removeItem(key);
      return null;
    }
    
    console.log(`[Cache] HIT: ${endpoint}`);
    return { data, fromCache: true };
  } catch (error) {
    console.warn('[Cache] Get error:', error.message);
    return null;
  }
};

/**
 * Сохранить данные в кэш
 */
export const setCache = (endpoint, params, data, ttl = DEFAULT_TTL) => {
  try {
    const key = createCacheKey(endpoint, params);
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    const serialized = JSON.stringify(cacheData);
    
    // Проверяем размер (localStorage лимит ~5MB)
    const currentSize = new Blob(Object.values(localStorage)).size;
    if (currentSize + serialized.length > 4 * 1024 * 1024) { // 4MB лимит
      console.warn('[Cache] Storage nearly full, clearing old entries...');
      clearExpiredCache();
    }
    
    localStorage.setItem(key, serialized);
    console.log(`[Cache] SET: ${endpoint} (TTL: ${ttl / 1000 / 60}min)`);
  } catch (error) {
    console.warn('[Cache] Set error:', error.message);
    // Если localStorage полон, очищаем старые записи
    if (error.name === 'QuotaExceededError') {
      clearOldestCache();
    }
  }
};

/**
 * Удалить конкретный ключ из кэша
 */
export const removeCache = (endpoint, params = {}) => {
  try {
    const key = createCacheKey(endpoint, params);
    localStorage.removeItem(key);
    console.log(`[Cache] REMOVE: ${endpoint}`);
  } catch (error) {
    console.warn('[Cache] Remove error:', error.message);
  }
};

/**
 * Очистить все записи кэша
 */
export const clearAllCache = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('[Cache] ALL CLEARED');
  } catch (error) {
    console.warn('[Cache] Clear all error:', error.message);
  }
};

/**
 * Очистить только истёкшие записи
 */
export const clearExpiredCache = () => {
  try {
    const now = Date.now();
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp, ttl } = JSON.parse(cached);
            if (now - timestamp > ttl) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          // Невалидный JSON, удаляем
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[Cache] Expired cleared: ${keysToRemove.length} items`);
  } catch (error) {
    console.warn('[Cache] Clear expired error:', error.message);
  }
};

/**
 * Очистить самые старые записи (при нехватке места)
 */
const clearOldestCache = () => {
  try {
    const entries = [];
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            entries.push({ key, timestamp });
          }
        } catch (e) {
          // Невалидный JSON, помечаем на удаление
          entries.push({ key, timestamp: 0 });
        }
      }
    }
    
    // Сортируем по времени (старые первые)
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Удаляем 50% самых старых записей
    const toRemove = entries.slice(0, Math.ceil(entries.length / 2));
    toRemove.forEach(({ key }) => localStorage.removeItem(key));
    
    console.log(`[Cache] Oldest cleared: ${toRemove.length} items`);
  } catch (error) {
    console.warn('[Cache] Clear oldest error:', error.message);
  }
};

/**
 * Получить статистику кэша
 */
export const getCacheStats = () => {
  try {
    let totalItems = 0;
    let expiredItems = 0;
    let totalSize = 0;
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(CACHE_PREFIX)) {
        totalItems++;
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            totalSize += cached.length;
            const { timestamp, ttl } = JSON.parse(cached);
            if (now - timestamp > ttl) {
              expiredItems++;
            }
          }
        } catch (e) {
          expiredItems++;
        }
      }
    }
    
    return {
      totalItems,
      expiredItems,
      activeItems: totalItems - expiredItems,
      totalSizeKB: (totalSize / 1024).toFixed(2)
    };
  } catch (error) {
    console.warn('[Cache] Stats error:', error.message);
    return { totalItems: 0, expiredItems: 0, activeItems: 0, totalSizeKB: 0 };
  }
};

/**
 * Обёртка для axios с автоматическим кэшированием
 */
export const cachedRequest = async (axios, baseurl, endpoint, params = {}, headers = {}, ttl = DEFAULT_TTL) => {
  // Пробуем получить из кэша
  const cached = getCache(endpoint, params);
  if (cached) {
    return { data: cached.data, fromCache: true };
  }
  
  // Если нет в кэше, делаем запрос
  console.log(`[Cache] MISS: ${endpoint}`);
  const response = await axios.get(`${baseurl}${endpoint}`, {
    params,
    headers
  });
  
  // Сохраняем в кэш
  setCache(endpoint, params, response.data, ttl);
  
  return { data: response.data, fromCache: false };
};

// Автоматическая очистка при загрузке страницы
if (typeof window !== 'undefined') {
  // Очищаем истёкшие записи при загрузке (неблокирующе)
  setTimeout(() => clearExpiredCache(), 1000);
}
