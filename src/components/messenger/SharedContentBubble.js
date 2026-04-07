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
 * @param {object} props.t - Объект с переводами
 */
const SharedContentBubble = ({ content, isOwn, onOpenOnSite, t }) => {
  if (!content) return null;

  const mediaType = content.media_type || "movie";
  const year = content.release_date
    ? content.release_date.split("-")[0]
    : "";
  const rating = content.vote_average
    ? content.vote_average.toFixed(1)
    : "—";

  // Формируем URL постера с проверкой
  const posterUrl = content.poster_path 
    ? `${IMAGE_BASE}${content.poster_path}`
    : null;

  // Логируем для отладки
  React.useEffect(() => {
    console.log('[SharedContentBubble] Content:', {
      id: content.id,
      title: content.title,
      hasPoster: !!content.poster_path,
      posterPath: content.poster_path,
      posterUrl,
    });
  }, [content]);

  const handleOpenKinopoisk = () => {
    const title = content.title;
    const type = mediaType === "tv" ? (t?.tvSeries || 'TV Series') : (t?.movie || 'Movie');
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
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={content.title || "Shared content"}
            loading="lazy"
            onError={(e) => {
              console.error('[SharedContentBubble] Failed to load poster:', posterUrl);
              e.target.style.display = 'none';
              const placeholder = e.target.parentElement.querySelector('.shared-content-poster-placeholder');
              if (placeholder) placeholder.style.display = 'flex';
            }}
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
            {mediaType === "movie" ? (t?.movie || "Movie") : (t?.tvSeries || "TV Series")}
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
