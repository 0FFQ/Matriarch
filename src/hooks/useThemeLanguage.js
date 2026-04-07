import { useState, useEffect, useMemo } from 'react';
import { translations } from '../i18n/translations';

/**
 * Кастомный хук для управления темой и языком
 * @returns {Object} состояние и функции для управления темой/языком
 */
const useThemeLanguage = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('matriarch_dark_mode');
    return savedTheme !== null ? savedTheme === 'true' : true;
  });

  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('matriarch_language');
    return savedLanguage || 'ru-RU';
  });

  // Текущие переводы
  const t = useMemo(() => translations[language], [language]);

  // Устанавливаем lang атрибут и тему при инициализации
  useEffect(() => {
    document.documentElement.lang = language;
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(darkMode ? 'dark' : 'light');
  }, []);

  // Переключение темы
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(newDarkMode ? 'dark' : 'light');
    localStorage.setItem('matriarch_dark_mode', newDarkMode.toString());
  };

  // Переключение языка
  const toggleLanguage = () => {
    const newLanguage = language === 'ru-RU' ? 'en-US' : 'ru-RU';
    setLanguage(newLanguage);
    localStorage.setItem('matriarch_language', newLanguage);
    document.documentElement.lang = newLanguage;
  };

  return {
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    t,
    toggleTheme,
    toggleLanguage
  };
};

export default useThemeLanguage;
