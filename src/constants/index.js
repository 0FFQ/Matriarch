// API константы
export const AUTH_TOKEN = process.env.REACT_APP_TMDB_TOKEN;
export const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Проверка наличия токена
if (!AUTH_TOKEN) {
  console.error('[Config] REACT_APP_TMDB_TOKEN не установлен. Создайте файл .env на основе .env.example');
}

// Пагинация
export const ITEMS_PER_PAGE = 6;

// Кэш TTL (в миллисекундах)
export const CACHE_TTL = {
  GENRES: 1000 * 60 * 60 * 24, // 24 часа
  SUGGESTIONS: 1000 * 60 * 15, // 15 минут
  SEARCH: 1000 * 60 * 60, // 1 час
  DISCOVER: 1000 * 60 * 60 * 2, // 2 часа
  TRAILERS: 1000 * 60 * 60 * 6, // 6 часов
};
