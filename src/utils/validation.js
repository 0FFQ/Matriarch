





const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_AVATAR_URL_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;
const MAX_FAVORITES_COUNT = 1000;
const MAX_WATCHED_COUNT = 10000;
const MAX_WATCHLIST_COUNT = 1000;


const NAME_REGEX = /^[\p{L}\p{N}\s\-_.'()]{0,100}$/u;





export class ValidationError extends Error {
  constructor(field, message) {
    super(`Validation error (${field}): ${message}`);
    this.name = 'ValidationError';
    this.field = field;
  }
}






export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';

  return str
    .replace(/<[^>]*>/g, '') 
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') 
    .replace(/javascript\s*:/gi, '') 
    .trim();
};






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


export const validateAvatarUrl = (url) => {
  if (!url) return '';
  if (typeof url !== 'string') {
    throw new ValidationError('avatar', 'URL аватара должен быть строкой');
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) return '';

  
  if (trimmed.startsWith('data:image')) {
    if (trimmed.length > 500000) { 
      console.warn('[Validation] Avatar data URI too large, skipping:', trimmed.length, 'chars');
      return '';
    }
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);

    
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


export const validateEmail = (email) => {
  if (!email) return null;
  if (typeof email !== 'string') {
    throw new ValidationError('email', 'Email должен быть строкой');
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    throw new ValidationError('email', 'Email слишком длинный');
  }

  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('email', 'Неверный формат email');
  }

  return email.toLowerCase().trim();
};


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


export const validateContentList = (list, fieldName, maxCount) => {
  if (!Array.isArray(list)) {
    throw new ValidationError(fieldName, `${fieldName} должен быть массивом`);
  }

  if (list.length > maxCount) {
    throw new ValidationError(fieldName, `${fieldName} не должен превышать ${maxCount} элементов`);
  }

  
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


export const validateUserData = (userData) => {
  if (!userData || typeof userData !== 'object') {
    throw new ValidationError('userData', 'Данные пользователя должны быть объектом');
  }

  const validated = {
    updatedAt: new Date().toISOString(),
  };

  
  if (userData.profile) {
    validated.profile = validateProfile(userData.profile);
  }

  
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


export const validateMessageData = (senderId, senderProfile, text) => {
  return {
    senderId: validateName(senderId), 
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
