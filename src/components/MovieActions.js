import React from "react";
import { motion } from "framer-motion";
import { Heart, Eye, Bookmark, Check } from "lucide-react";
import { useUser } from "../context/UserContext";

/**
 * Кнопки действий с фильмом/сериалом
 * @param {object} props
 * @param {object} props.item - Элемент контента
 * @param {string} props.placement - Расположение ('card' или другое)
 */
const MovieActions = ({ item, placement = "card" }) => {
  const {
    toggleFavorite,
    toggleWatched,
    toggleWatchlist,
    isInFavorites,
    isInWatched,
    isInWatchlist,
  } = useUser();

  const isFavorite = isInFavorites(item.id);
  const isWatched = isInWatched(item.id);
  const isWatchlist = isInWatchlist(item.id);

  /**
   * Обработчик клика по кнопке действия
   */
  const handleToggle = (action, event) => {
    event.preventDefault();
    event.stopPropagation();
    action(item);
  };

  return (
    <div
      className={`movie-actions ${
        placement === "card" ? "movie-actions-card" : ""
      }`}
    >
      {/* Избранное */}
      <motion.button
        className={`action-btn ${isFavorite ? "active" : ""}`}
        onClick={(e) => handleToggle(toggleFavorite, e)}
        whileTap={{ scale: 0.9 }}
        title={isFavorite ? "Удалить из избранного" : "В избранное"}
        aria-label={isFavorite ? "Удалить из избранного" : "В избранное"}
      >
        {isFavorite ? <Check size={14} /> : <Heart size={14} />}
      </motion.button>

      {/* Просмотренное */}
      <motion.button
        className={`action-btn ${isWatched ? "active watched" : ""}`}
        onClick={(e) => handleToggle(toggleWatched, e)}
        whileTap={{ scale: 0.9 }}
        title={isWatched ? "Убрать из просмотренного" : "Я посмотрел"}
        aria-label={isWatched ? "Убрать из просмотренного" : "Я посмотрел"}
      >
        {isWatched ? <Check size={14} /> : <Eye size={14} />}
      </motion.button>

      {/* Буду смотреть */}
      <motion.button
        className={`action-btn ${isWatchlist ? "active watchlist" : ""}`}
        onClick={(e) => handleToggle(toggleWatchlist, e)}
        whileTap={{ scale: 0.9 }}
        title={
          isWatchlist ? 'Удалить из "Буду смотреть"' : "Буду смотреть"
        }
        aria-label={
          isWatchlist ? 'Удалить из "Буду смотреть"' : "Буду смотреть"
        }
      >
        {isWatchlist ? <Check size={14} /> : <Bookmark size={14} />}
      </motion.button>
    </div>
  );
};

export default MovieActions;
