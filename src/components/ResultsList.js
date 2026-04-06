import React, { memo } from "react";
import { motion } from "framer-motion";
import { Star, TrendingUp, Database } from "lucide-react";
import MovieActions from "./MovieActions";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

/**
 * Список результатов поиска
 */
const ResultsList = memo(({ results, imageBase = IMAGE_BASE, onSelect, fromCache }) => {
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
    const type = item.media_type === "tv" ? "сериал" : "фильм";
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
              <img
                src={`${imageBase}${item.poster_path}`}
                alt={item.title || item.name}
                loading="lazy"
              />
              <MovieActions item={item} />
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
