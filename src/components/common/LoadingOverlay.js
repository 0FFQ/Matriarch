import React from 'react';
import { motion } from 'framer-motion';

/**
 * Компонент глобального индикатора загрузки
 * @param {string} language - текущий язык
 */
const LoadingOverlay = ({ language }) => {
  return (
    <motion.div
      className="global-loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="loading-overlay">
        <div className="loading-spinner-large">
          <div className="spinner-large"></div>
          <p className="loading-text">
            {language === 'ru-RU' ? 'Загрузка...' : 'Loading...'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingOverlay;
