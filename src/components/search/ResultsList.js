import React, { memo } from "react";
import { motion } from "framer-motion";
import { Star, TrendingUp, Database } from "lucide-react";
import MovieActions from "../player/MovieActions";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

/**
 * Список результатов поиска
 */
const ResultsList = memo(({ results, imageBase = IMAGE_BASE, onSelect, fromCache, onShareInChat, t }) => {
  const isSingleResult = results.length === 1;

  /**
   * Обработчик клика по карточке
   */
  const handleCardClick = (event, item) => {
    // Не переходим по ссылке если клик по иконке Кинопоиска
    if (!event.target.closest(".kinopoisk-icon")) {
      event.preventDefault();
      onSelect(item.id, item.media_type);
    }
  };

  /**
   * Получить ссылку на Кинопоиск
   */
  const getKinopoiskLink = (item) => {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || "").split("-")[0];
    const type = item.media_type === "tv" ? (t?.tvSeries || 'TV Series') : (t?.movie || 'Movie');
    return `https://www.kinopoisk.ru/search/?query=${encodeURIComponent(
      `${title} ${year} ${type}`
    )}`;
  };

  /**
   * Форматировать год
   */
  const formatYear = (dateString) => {
    if (!dateString) return "";
    return dateString.split("-")[0];
  };

  /**
   * Форматировать рейтинг
   */
  const formatRating = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "—";
    return value.toFixed(1);
  };

  return (
    <>
      {/* Индикатор кэша */}
      {fromCache && (
        <motion.div
          className="cache-indicator"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <Database size={14} />
          <span>Загружено из кэша</span>
        </motion.div>
      )}

      {/* Список карточек */}
      <motion.div
        className={isSingleResult ? "results-list-single" : "results-list"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
      >
        {results.slice(0, 10).map((item, index) => (
          <motion.a
            key={item.id}
            href={getKinopoiskLink(item)}
            target="_blank"
            rel="noopener noreferrer"
            className={`result-card ${
              isSingleResult ? "result-card-large" : ""
            }`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ delay: index * 0.05 }}
            onClick={(event) => handleCardClick(event, item)}
          >
            {/* Постер */}
            <div className="poster-wrapper">
              {item.poster_path ? (
                <img
                  src={`${imageBase}${item.poster_path}`}
                  alt={item.title || item.name}
                  loading="lazy"
                />
              ) : (
                <div className="poster-placeholder">
                  {item.media_type === 'tv' ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                      <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                      <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                    </svg>
                  )}
                  <span>{item.media_type === 'tv' ? (t?.tvSeries || 'TV Series') : (t?.movie || 'Movie')}</span>
                </div>
              )}
              <MovieActions item={item} onShareInChat={onShareInChat} />
            </div>

            {/* Информация */}
            <div className="title-wrapper">
              <h3>{item.title || item.name}</h3>
              <div className="meta-row">
                <p>{formatYear(item.release_date || item.first_air_date)}</p>
                <div className="ratings-badge">
                  <div className="rating-item rating-popularity">
                    <TrendingUp size={12} />
                    <span>{formatRating(item.popularity)}</span>
                  </div>
                  <div className="rating-item rating-tmdb">
                    <Star size={12} fill="currentColor" />
                    <span>{formatRating(item.vote_average)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.a>
        ))}
      </motion.div>
    </>
  );
});

export default ResultsList;
