/**
 * Утилиты обработки ошибок API (без React зависимостей)
 *
 * Централизованная обработка ошибок с:
 * - Классификацией типов ошибок (сеть, авторизация, сервер, лимиты)
 * - Информативными сообщениями для пользователя
 * - Логированием для разработчика
 */

// ============================================
// Типы ошибок
// ============================================

export const ErrorType = {
  NETWORK: 'network',
  AUTH: 'auth',
  RATE_LIMIT: 'rate_limit',
  SERVER: 'server',
  CLIENT: 'client',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
};

// ============================================
// Сообщения об ошибках для пользователя
// ============================================

const userMessages = {
  [ErrorType.NETWORK]: {
    ru: 'Нет подключения к интернету. Проверьте соединение и попробуйте снова.',
    en: 'No internet connection. Please check your connection and try again.',
  },
  [ErrorType.AUTH]: {
    ru: 'Ошибка авторизации. Возможно, ваш API-ключ недействителен.',
    en: 'Authorization error. Your API key may be invalid.',
  },
  [ErrorType.RATE_LIMIT]: {
    ru: 'Слишком много запросов. Подождите немного и попробуйте снова.',
    en: 'Too many requests. Please wait a moment and try again.',
  },
  [ErrorType.SERVER]: {
    ru: 'Ошибка сервера. Попробуйте позже.',
    en: 'Server error. Please try again later.',
  },
  [ErrorType.CLIENT]: {
    ru: 'Неверный запрос. Проверьте параметры и попробуйте снова.',
    en: 'Invalid request. Please check the parameters and try again.',
  },
  [ErrorType.TIMEOUT]: {
    ru: 'Запрос занял слишком много времени. Попробуйте снова.',
    en: 'Request timed out. Please try again.',
  },
  [ErrorType.UNKNOWN]: {
    ru: 'Произошла неизвестная ошибка. Попробуйте позже.',
    en: 'An unknown error occurred. Please try again later.',
  },
};

// ============================================
// Классификация ошибок
// ============================================

/**
 * Определить тип ошибки по Axios error объекту
 */
export const classifyError = (error) => {
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }
    return ErrorType.NETWORK;
  }

  const status = error.response.status;

  if (status === 401 || status === 403) {
    return ErrorType.AUTH;
  }

  if (status === 429) {
    return ErrorType.RATE_LIMIT;
  }

  if (status >= 400 && status < 500) {
    return ErrorType.CLIENT;
  }

  if (status >= 500) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
};

/**
 * Получить сообщение об ошибке для пользователя
 */
export const getUserErrorMessage = (error, language = 'ru') => {
  const errorType = classifyError(error);
  const messages = userMessages[errorType];
  return messages?.[language] || messages?.ru || userMessages[ErrorType.UNKNOWN].ru;
};

/**
 * Создать объект ошибки для логирования
 */
export const createErrorReport = (error, context = {}) => {
  const errorType = classifyError(error);

  return {
    type: errorType,
    message: error?.message || 'Unknown error',
    status: error?.response?.status,
    statusText: error?.response?.statusText,
    url: error?.config?.url,
    params: error?.config?.params,
    timestamp: new Date().toISOString(),
    context,
  };
};

/**
 * Записать ошибку в лог (для разработчика)
 */
export const logApiError = (error, context = {}) => {
  const report = createErrorReport(error, context);

  if (report.type === ErrorType.AUTH) {
    console.warn('[API] Auth error (check API token):', report.message);
    return;
  }

  console.error('[API] Request failed:', report);
};
