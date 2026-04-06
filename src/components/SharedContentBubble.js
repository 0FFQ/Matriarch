import React from "react";
import { motion } from "framer-motion";
import { Film, Tv, Star, ExternalLink, Play } from "lucide-react";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w154";

/**
 * Пузырь сообщения с прикреплённым контентом (фильм/сериал)
 * @param {object} props
 * @param {object} props.content - Данные о фильме
 * @param {boolean} props.isOwn - Своё ли это сообщение
 * @param {function} props.onOpenOnSite - Callback: открыть карточку на сайте
 */
const SharedContentBubble = ({ content, isOwn, onOpenOnSite }) => {
  if (!content) return null;

  const mediaType = content.media_type || "movie";
  const year = content.release_date
    ? content.release_date.split("-")[0]
    : "";
  const rating = content.vote_average
    ? content.vote_average.toFixed(1)
    : "—";

  const handleOpenKinopoisk = () => {
    const title = content.title;
    const type = mediaType === "tv" ? "сериал" : "фильм";
    const url = `https://www.kinopoisk.ru/search/?query=${encodeURIComponent(
      `${title} ${year} ${type}`
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenOnSite = () => {
    if (onOpenOnSite) {
      onOpenOnSite(content);
    }
  };

  return (
    <motion.div
      className={`shared-content-bubble ${isOwn ? "own" : "other"}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Постер — клик открывает карточку на сайте */}
      <div
        className="shared-content-poster shared-content-poster-clickable"
        onClick={handleOpenOnSite}
        title="Открыть на сайте"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleOpenOnSite();
          }
        }}
      >
        {content.poster_path ? (
          <img
            src={`${IMAGE_BASE}${content.poster_path}`}
            alt={content.title}
            loading="lazy"
          />
        ) : (
          <div className="shared-content-poster-placeholder">
            {mediaType === "movie" ? <Film size={32} /> : <Tv size={32} />}
          </div>
        )}
        {/* Оверлей при наведении */}
        <div className="shared-content-poster-overlay">
          <Play size={24} />
        </div>
      </div>

      {/* Информация */}
      <div className="shared-content-info">
        <div className="shared-content-header">
          <h4
            className="shared-content-title shared-content-title-link"
            onClick={handleOpenOnSite}
            title="Открыть на сайте"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleOpenOnSite();
              }
            }}
          >
            {content.title}
          </h4>
          <button
            className="shared-content-open-btn"
            onClick={handleOpenKinopoisk}
            title="Открыть на Кинопоиске"
            aria-label="Открыть на Кинопоиске"
          >
            <ExternalLink size={14} />
          </button>
        </div>

        <div className="shared-content-meta">
          <span className="shared-content-type">
            {mediaType === "movie" ? "Фильм" : "Сериал"}
          </span>
          {year && <span className="shared-content-year">{year}</span>}
          <span className="shared-content-rating">
            <Star size={12} fill="currentColor" />
            {rating}
          </span>
        </div>

        {content.overview && (
          <p className="shared-content-overview">
            {content.overview.substring(0, 150)}
            {content.overview.length > 150 ? "..." : ""}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default SharedContentBubble;
