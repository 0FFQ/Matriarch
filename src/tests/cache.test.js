import {
  getCache,
  setCache,
  removeCache,
  clearAllCache,
  clearExpiredCache,
  getCacheStats,
  cachedRequest,
} from '../utils/cache';
import axios from 'axios';

describe('Cache Utility', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getCache / setCache', () => {
    test('should return null for non-existent cache', () => {
      const result = getCache('/test', { param: 'value' });
      expect(result).toBeNull();
    });

    test('should store and retrieve cache data', () => {
      const testData = { name: 'test', value: 123 };
      setCache('/test', { param: 'value' }, testData);

      const result = getCache('/test', { param: 'value' });
      expect(result).not.toBeNull();
      expect(result.data).toEqual(testData);
      expect(result.fromCache).toBe(true);
    });

    test('should return null for expired cache', () => {
      const testData = { name: 'test' };
      // TTL 1ms - практически мгновенно истекает
      setCache('/test', { param: 'value' }, testData, 1);

      // Ждём истечения TTL
      return new Promise((resolve) => {
        setTimeout(() => {
          const result = getCache('/test', { param: 'value' });
          expect(result).toBeNull();
          resolve();
        }, 10);
      });
    });

    test('should create different cache keys for different params', () => {
      const data1 = { id: 1 };
      const data2 = { id: 2 };

      setCache('/test', { page: 1 }, data1);
      setCache('/test', { page: 2 }, data2);

      const result1 = getCache('/test', { page: 1 });
      const result2 = getCache('/test', { page: 2 });

      expect(result1.data).toEqual(data1);
      expect(result2.data).toEqual(data2);
    });
  });

  describe('removeCache', () => {
    test('should remove specific cache entry', () => {
      setCache('/test', { id: 1 }, { data: 'test' });
      removeCache('/test', { id: 1 });

      const result = getCache('/test', { id: 1 });
      expect(result).toBeNull();
    });
  });

  describe('clearAllCache', () => {
    test('should clear all cache entries', () => {
      setCache('/test1', {}, { data: 1 });
      setCache('/test2', {}, { data: 2 });
      localStorage.setItem('other_key', 'value');

      clearAllCache();

      expect(getCache('/test1', {})).toBeNull();
      expect(getCache('/test2', {})).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('value');
    });
  });

  describe('clearExpiredCache', () => {
    test('should remove only expired entries', () => {
      setCache('/expired', {}, { data: 'old' }, 1);
      setCache('/valid', {}, { data: 'new' }, 1000 * 60 * 60); // 1 hour

      return new Promise((resolve) => {
        setTimeout(() => {
          clearExpiredCache();

          expect(getCache('/expired', {})).toBeNull();
          expect(getCache('/valid', {})).not.toBeNull();
          resolve();
        }, 10);
      });
    });
  });

  describe('getCacheStats', () => {
    test('should return stats object', () => {
      setCache('/test1', {}, { data: 1 });
      setCache('/test2', {}, { data: 2 });

      const stats = getCacheStats();

      expect(stats).toHaveProperty('totalItems');
      expect(stats).toHaveProperty('expiredItems');
      expect(stats).toHaveProperty('activeItems');
      expect(stats).toHaveProperty('totalSizeKB');
      expect(stats.totalItems).toBe(2);
      expect(stats.activeItems).toBe(2);
      expect(stats.expiredItems).toBe(0);
    });

    test('should count expired items correctly', () => {
      setCache('/expired', {}, { data: 'old' }, 1);
      setCache('/valid', {}, { data: 'new' }, 1000 * 60 * 60);

      return new Promise((resolve) => {
        setTimeout(() => {
          // Сначала вызываем getCache чтобы триггернуть удаление expired
          getCache('/expired', {});
          
          const stats = getCacheStats();

          expect(stats.totalItems).toBe(1);
          expect(stats.expiredItems).toBe(0);
          expect(stats.activeItems).toBe(1);
          resolve();
        }, 10);
      });
    });
  });

  describe('cachedRequest', () => {
    test('should return cached data on second call', async () => {
      const mockData = { results: [{ id: 1 }] };
      const mockAxios = {
        get: jest.fn().mockResolvedValue({ data: mockData }),
      };

      // Первый запрос - кэш промах
      const result1 = await cachedRequest(
        mockAxios,
        'https://api.test.com',
        '/endpoint',
        { param: 1 },
        { Authorization: 'Bearer token' }
      );

      expect(result1.fromCache).toBe(false);
      expect(result1.data).toEqual(mockData);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);

      // Второй запрос - кэш попадание
      const result2 = await cachedRequest(
        mockAxios,
        'https://api.test.com',
        '/endpoint',
        { param: 1 },
        { Authorization: 'Bearer token' }
      );

      expect(result2.fromCache).toBe(true);
      expect(result2.data).toEqual(mockData);
      expect(mockAxios.get).toHaveBeenCalledTimes(1); // Не вызывался снова
    });

    test('should make new request for different params', async () => {
      const mockAxios = {
        get: jest
          .fn()
          .mockResolvedValueOnce({ data: { page: 1 } })
          .mockResolvedValueOnce({ data: { page: 2 } }),
      };

      await cachedRequest(mockAxios, 'https://api.test.com', '/endpoint', { page: 1 }, {});
      await cachedRequest(mockAxios, 'https://api.test.com', '/endpoint', { page: 2 }, {});

      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});
