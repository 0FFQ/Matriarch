import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Компонент отображения виджета "Трейлер не найден"
 * @param {Object} movie - информация о фильме
 * @param {function} onClose - функция закрытия
 * @param {Object} t - объект с переводами
 */
const NoTrailerWidget = ({ movie, onClose, t }) => {
  if (!movie) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="no-trailer-widget"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="no-trailer-content" onClick={(e) => e.stopPropagation()}>
          <h2>{t.trailerNotFound}</h2>
          <p>{t.trailerNotFoundText}«{movie.title}» {t.notFound}</p>
          <a
            href={`https://www.kinopoisk.ru/search/?query=${encodeURIComponent(`${movie.title} ${movie.year}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="kinopoisk-widget-btn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h2v8H8V8zm4 0h2v8h-2V8zm4 0h-2v8h2V8z"/>
            </svg>
            <span>{t.kinopoisk}</span>
          </a>
          <button className="close-widget" onClick={onClose}>✕</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NoTrailerWidget;
