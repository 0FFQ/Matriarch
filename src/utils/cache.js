/**
 * Утилита кэширования для TMDB API
 *
 * Возможности:
 * - Автоматическое кэширование запросов
 * - Настраиваемый TTL (время жизни)
 * - Хранение в localStorage
 * - Автоматическая очистка истёкших записей
 * - Защита от переполнения localStorage
 */

const CACHE_PREFIX = "matriarch_cache_";
const DEFAULT_TTL = 1000 * 60 * 30; // 30 минут
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB лимит

// ============================================
// Внутренние утилиты
// ============================================

/**
 * Создать ключ кэша из endpoint и параметров
 */
const createCacheKey = (endpoint, params = {}) => {
  const paramString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return `${CACHE_PREFIX}${endpoint}?${paramString}`;
};

/**
 * Безопасно получить все ключи кэша
 */
const getCacheKeys = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Проверить, является ли запись истёкшей
 */
const isExpired = (cached) => {
  try {
    const { timestamp, ttl } = JSON.parse(cached);
    return Date.now() - timestamp > ttl;
  } catch {
    return true; // Невалидный JSON считаем истёкшим
  }
};

// ============================================
// Чтение/запись кэша
// ============================================

/**
 * Получить данные из кэша
 * @param {string} endpoint - API endpoint
 * @param {object} params - Параметры запроса
 * @returns {{data: *, fromCache: boolean}|null}
 */
export const getCache = (endpoint, params = {}) => {
  try {
    const key = createCacheKey(endpoint, params);
    const cached = localStorage.getItem(key);

    if (!cached) return null;

    if (isExpired(cached)) {
      localStorage.removeItem(key);
      return null;
    }

    const { data } = JSON.parse(cached);
    return { data, fromCache: true };
  } catch (error) {
    console.warn("[Cache] Get error:", error.message);
    return null;
  }
};

/**
 * Сохранить данные в кэш
 * @param {string} endpoint - API endpoint
 * @param {object} params - Параметры запроса
 * @param {*} data - Данные для сохранения
 * @param {number} ttl - Время жизни в мс
 */
export const setCache = (
  endpoint,
  params,
  data,
  ttl = DEFAULT_TTL
) => {
  try {
    const key = createCacheKey(endpoint, params);
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    const serialized = JSON.stringify(cacheData);

    // Проверяем доступное место
    const currentSize = new Blob(Object.values(localStorage)).size;
    if (currentSize + serialized.length > MAX_STORAGE_SIZE) {
      console.warn("[Cache] Storage nearly full, clearing old entries...");
      clearExpiredCache();
    }

    localStorage.setItem(key, serialized);
  } catch (error) {
    console.warn("[Cache] Set error:", error.message);
    if (error.name === "QuotaExceededError") {
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
  } catch (error) {
    console.warn("[Cache] Remove error:", error.message);
  }
};

// ============================================
// Очистка кэша
// ============================================

/**
 * Очистить все записи кэша
 */
export const clearAllCache = () => {
  try {
    const keysToRemove = getCacheKeys();
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("[Cache] Clear all error:", error.message);
  }
};

/**
 * Очистить только истёкшие записи
 */
export const clearExpiredCache = () => {
  try {
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached && isExpired(cached)) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("[Cache] Clear expired error:", error.message);
  }
};

/**
 * Очистить самые старые записи (при нехватке места)
 */
const clearOldestCache = () => {
  try {
    const entries = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            entries.push({ key, timestamp });
          }
        } catch {
          entries.push({ key, timestamp: 0 });
        }
      }
    }

    // Сортируем по времени (старые первые)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Удаляем 50% самых старых записей
    const toRemove = entries.slice(
      0,
      Math.ceil(entries.length / 2)
    );
    toRemove.forEach(({ key }) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("[Cache] Clear oldest error:", error.message);
  }
};

// ============================================
// Статистика
// ============================================

/**
 * Получить статистику кэша
 * @returns {{totalItems: number, expiredItems: number, activeItems: number, totalSizeKB: string}}
 */
export const getCacheStats = () => {
  try {
    let totalItems = 0;
    let expiredItems = 0;
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        totalItems++;
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            totalSize += cached.length;
            if (isExpired(cached)) {
              expiredItems++;
            }
          }
        } catch {
          expiredItems++;
        }
      }
    }

    return {
      totalItems,
      expiredItems,
      activeItems: totalItems - expiredItems,
      totalSizeKB: (totalSize / 1024).toFixed(2),
    };
  } catch (error) {
    console.warn("[Cache] Stats error:", error.message);
    return {
      totalItems: 0,
      expiredItems: 0,
      activeItems: 0,
      totalSizeKB: 0,
    };
  }
};

// ============================================
// Обёртка для axios
// ============================================

/**
 * Выполнить запрос с автоматическим кэшированием
 * @param {object} axios - Экземпляр axios
 * @param {string} baseurl - Базовый URL
 * @param {string} endpoint - Endpoint
 * @param {object} params - Параметры
 * @param {object} headers - Заголовки
 * @param {number} ttl - Время жизни кэша
 * @returns {{data: *, fromCache: boolean}}
 */
export const cachedRequest = async (
  axios,
  baseurl,
  endpoint,
  params = {},
  headers = {},
  ttl = DEFAULT_TTL
) => {
  // Пробуем получить из кэша
  const cached = getCache(endpoint, params);
  if (cached) {
    return { data: cached.data, fromCache: true };
  }

  // Запрос к API
  const response = await axios.get(`${baseurl}${endpoint}`, {
    params,
    headers,
  });

  // Сохраняем в кэш
  setCache(endpoint, params, response.data, ttl);

  return { data: response.data, fromCache: false };
};

// ============================================
// Инициализация
// ============================================

// Автоматическая очистка истёкших записей при загрузке
if (typeof window !== "undefined") {
  setTimeout(() => clearExpiredCache(), 1000);
}
