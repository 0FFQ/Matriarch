
export const AUTH_TOKEN = process.env.REACT_APP_TMDB_TOKEN;
export const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';


if (!AUTH_TOKEN) {
  console.error('[Config] REACT_APP_TMDB_TOKEN не установлен. Создайте файл .env на основе .env.example');
}


export const ITEMS_PER_PAGE = 6;


export const CACHE_TTL = {
  GENRES: 1000 * 60 * 60 * 24, 
  SUGGESTIONS: 1000 * 60 * 15, 
  SEARCH: 1000 * 60 * 60, 
  DISCOVER: 1000 * 60 * 60 * 2, 
  TRAILERS: 1000 * 60 * 60 * 6, 
};
