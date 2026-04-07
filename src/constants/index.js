// API константы
export const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5YWY0MzRlNWZjNDk1N2I0OTlkZWMzY2FhZmNjYjk2ZCIsIm5iZiI6MTc1NjcyNjgwNC44ODgsInN1YiI6IjY4YjU4NjE0YjQ3NWQ5NjJlMTllMjA4NyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.oAfRNRh81PD-viu5rMg4ubRtcQfBK45Mt6RpUy3DSNk';
export const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

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
