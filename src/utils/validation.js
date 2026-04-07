/**
 * Утилиты валидации данных для Firestore
 *
 * Обеспечивают проверку данных перед записью в базу:
 * - Санитизация строк (удаление опасных символов)
 * - Проверка длины и типа данных
 * - Валидация схем объектов
 */

// ============================================
// Константы
// ============================================

const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_AVATAR_URL_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;
const MAX_FAVORITES_COUNT = 1000;
const MAX_WATCHED_COUNT = 10000;
const MAX_WATCHLIST_COUNT = 1000;

// Разрешённые символы в имени (буквы, цифры, пробелы, базовая пунктуация)
const NAME_REGEX = /^[\p{L}\p{N}\s\-_.'()]{0,100}$/u;

// ============================================
// Ошибки валидации
// ============================================

export class ValidationError extends Error {
  constructor(field, message) {
    super(`Validation error (${field}): ${message}`);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// ============================================
// Санитизация
// ============================================

/**
 * Удалить потенциально опасные HTML-сущности и управляющие символы
 * @param {string} str
 * @returns {string}
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';

  return str
    .replace(/<[^>]*>/g, '') // Удалить HTML-теги
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Удалить управляющие символы
    .replace(/javascript\s*:/gi, '') // Удалить javascript: протокол
    .trim();
};

// ============================================
// Валидация полей
// ============================================

/**
 * Проверить и очистить имя
 */
export const validateName = (name) => {
  if (name === null || name === undefined) return null;
  if (typeof name !== 'string') {
    throw new ValidationError('name', 'Имя должно быть строкой');
  }

  const cleaned = sanitizeString(name);

  if (cleaned.length === 0) return '';
  if (cleaned.length > MAX_NAME_LENGTH) {
    throw new ValidationError('name', `Имя не должно превышать ${MAX_NAME_LENGTH} символов`);
  }

  if (!NAME_REGEX.test(cleaned)) {
    throw new ValidationError('name', 'Имя содержит недопустимые символы');
  }

  return cleaned;
};

/**
 * Проверить URL аватара
 */
export const validateAvatarUrl = (url) => {
  if (!url) return '';
  if (typeof url !== 'string') {
    throw new ValidationError('avatar', 'URL аватара должен быть строкой');
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) return '';

  // Data URI (base64 изображение)
  if (trimmed.startsWith('data:image')) {
    if (trimmed.length > 500000) { // макс. ~500KB
      console.warn('[Validation] Avatar data URI too large, skipping:', trimmed.length, 'chars');
      return '';
    }
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);

    // Google/TMDB аватары — принимаем любые
    if (
      parsed.hostname.endsWith('.googleusercontent.com') ||
      parsed.hostname === 'googleusercontent.com' ||
      parsed.hostname.endsWith('.google.com') ||
      parsed.hostname.endsWith('.ggpht.com') ||
      parsed.hostname === 'image.tmdb.org' ||
      parsed.hostname === 'secure.gravatar.com'
    ) {
      return trimmed;
    }

    // Для недоверенных источников — проверка длины
    if (trimmed.length > MAX_AVATAR_URL_LENGTH) {
      console.error('[Validation] Long avatar URL:', trimmed.substring(0, 200));
      console.error('[Validation] URL length:', trimmed.length, 'chars, hostname:', parsed.hostname);
    }
  } catch {
    return '';
  }

  if (trimmed.length > MAX_AVATAR_URL_LENGTH) {
    throw new ValidationError('avatar', `URL слишком длинный (${trimmed.length} символов)`);
  }

  return trimmed;
};

/**
 * Проверить email
 */
export const validateEmail = (email) => {
  if (!email) return null;
  if (typeof email !== 'string') {
    throw new ValidationError('email', 'Email должен быть строкой');
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    throw new ValidationError('email', 'Email слишком длинный');
  }

  // RFC 5322 упрощённая проверка
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('email', 'Неверный формат email');
  }

  return email.toLowerCase().trim();
};

/**
 * Проверить текст сообщения
 */
export const validateMessageText = (text) => {
  if (typeof text !== 'string') {
    throw new ValidationError('text', 'Сообщение должно быть строкой');
  }

  const cleaned = sanitizeString(text);

  if (cleaned.length === 0) {
    throw new ValidationError('text', 'Сообщение не может быть пустым');
  }

  if (cleaned.length > MAX_MESSAGE_LENGTH) {
    throw new ValidationError('text', `Сообщение не должно превышать ${MAX_MESSAGE_LENGTH} символов`);
  }

  return cleaned;
};

// ============================================
// Валидация схем
// ============================================

/**
 * Проверить профиль пользователя
 */
export const validateProfile = (profile) => {
  if (!profile || typeof profile !== 'object') {
    throw new ValidationError('profile', 'Профиль должен быть объектом');
  }

  return {
    name: validateName(profile.name),
    avatar: validateAvatarUrl(profile.avatar),
    email: validateEmail(profile.email),
  };
};

/**
 * Проверить массив избранного/просмотренного/списка просмотра
 */
export const validateContentList = (list, fieldName, maxCount) => {
  if (!Array.isArray(list)) {
    throw new ValidationError(fieldName, `${fieldName} должен быть массивом`);
  }

  if (list.length > maxCount) {
    throw new ValidationError(fieldName, `${fieldName} не должен превышать ${maxCount} элементов`);
  }

  // Проверить структуру элементов
  return list.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new ValidationError(fieldName, `Элемент ${index} должен быть объектом`);
    }

    return {
      id: Number(item.id),
      title: sanitizeString(item.title || item.name || '').substring(0, 200),
      poster_path: item.poster_path ? sanitizeString(item.poster_path).substring(0, 500) : null,
      media_type: ['movie', 'tv'].includes(item.media_type) ? item.media_type : 'movie',
      addedAt: item.addedAt || item.watchedAt || Date.now(),
    };
  });
};

/**
 * Полная валидация данных пользователя перед сохранением
 */
export const validateUserData = (userData) => {
  if (!userData || typeof userData !== 'object') {
    throw new ValidationError('userData', 'Данные пользователя должны быть объектом');
  }

  const validated = {
    updatedAt: new Date().toISOString(),
  };

  // Профиль
  if (userData.profile) {
    validated.profile = validateProfile(userData.profile);
  }

  // Списки контента
  if (userData.favorites) {
    validated.favorites = validateContentList(userData.favorites, 'favorites', MAX_FAVORITES_COUNT);
  }

  if (userData.watched) {
    validated.watched = validateContentList(userData.watched, 'watched', MAX_WATCHED_COUNT);
  }

  if (userData.watchlist) {
    validated.watchlist = validateContentList(userData.watchlist, 'watchlist', MAX_WATCHLIST_COUNT);
  }

  return validated;
};

/**
 * Валидация данных сообщения перед отправкой
 */
export const validateMessageData = (senderId, senderProfile, text) => {
  return {
    senderId: validateName(senderId), // UID Firebase — alphanumeric
    senderName: validateName(senderProfile.name) || 'Anonymous',
    senderAvatar: validateAvatarUrl(senderProfile.avatar),
    text: validateMessageText(text),
  };
};

export default {
  ValidationError,
  sanitizeString,
  validateName,
  validateAvatarUrl,
  validateEmail,
  validateMessageText,
  validateProfile,
  validateContentList,
  validateUserData,
  validateMessageData,
};
