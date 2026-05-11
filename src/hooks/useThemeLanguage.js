import { useState, useEffect, useMemo } from 'react';
import { translations } from '../i18n/translations';


const useThemeLanguage = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('matriarch_dark_mode');
    return savedTheme !== null ? savedTheme === 'true' : true;
  });

  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('matriarch_language');
    return savedLanguage || 'ru-RU';
  });

  
  const t = useMemo(() => translations[language], [language]);

  
  useEffect(() => {
    document.documentElement.lang = language;
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(darkMode ? 'dark' : 'light');
  }, []);

  
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(newDarkMode ? 'dark' : 'light');
    localStorage.setItem('matriarch_dark_mode', newDarkMode.toString());
  };

  
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
