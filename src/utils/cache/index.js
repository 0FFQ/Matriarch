

const CACHE_PREFIX = "matriarch_cache_";
const DEFAULT_TTL = 1000 * 60 * 30; 
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; 






const createCacheKey = (endpoint, params = {}) => {
  const paramString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return `${CACHE_PREFIX}${endpoint}?${paramString}`;
};


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


const isExpired = (cached) => {
  try {
    const { timestamp, ttl } = JSON.parse(cached);
    return Date.now() - timestamp > ttl;
  } catch {
    return true; 
  }
};






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


export const removeCache = (endpoint, params = {}) => {
  try {
    const key = createCacheKey(endpoint, params);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("[Cache] Remove error:", error.message);
  }
};






export const clearAllCache = () => {
  try {
    const keysToRemove = getCacheKeys();
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("[Cache] Clear all error:", error.message);
  }
};


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

    
    entries.sort((a, b) => a.timestamp - b.timestamp);

    
    const toRemove = entries.slice(
      0,
      Math.ceil(entries.length / 2)
    );
    toRemove.forEach(({ key }) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("[Cache] Clear oldest error:", error.message);
  }
};






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






export const cachedRequest = async (
  axios,
  baseurl,
  endpoint,
  params = {},
  headers = {},
  ttl = DEFAULT_TTL
) => {
  
  const cached = getCache(endpoint, params);
  if (cached) {
    return { data: cached.data, fromCache: true };
  }

  
  const response = await axios.get(`${baseurl}${endpoint}`, {
    params,
    headers,
  });

  
  setCache(endpoint, params, response.data, ttl);

  return { data: response.data, fromCache: false };
};






if (typeof window !== "undefined") {
  setTimeout(() => clearExpiredCache(), 1000);
}
