import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, Sliders, RotateCcw, Film, Tv, Globe, Star } from "lucide-react";

/**
 * Панель фильтров
 */
const FilterPanel = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
  genres,
  loadingGenres,
  t,
}) => {
  const dragControls = useDragControls();
  const panelRef = useRef(null);
  const [constraints, setConstraints] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });

  // Вычисляем ограничения для перетаскивания
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const headerEl = panelRef.current.querySelector('.filter-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 70;
      const panelHeight = panelRef.current.offsetHeight;
      const initialTop = 16;
      const maxTranslateY = window.innerHeight - initialTop - headerHeight;
      setConstraints({
        left: -(window.innerWidth - 400),
        right: 0,
        top: 0,
        bottom: Math.max(0, maxTranslateY),
      });
    }
  }, [isOpen]);

  // Обработка Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Генерация списка годов
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Опции сортировки
  const sortOptions = [
    { value: "popularity.desc", label: t.byPopularity },
    { value: "vote_average.desc", label: t.byRating },
    { value: "primary_release_date.desc", label: t.byDateNew },
    { value: "primary_release_date.asc", label: t.byDateOld },
    { value: "title.asc", label: t.byTitleAZ },
    { value: "title.desc", label: t.byTitleZA },
  ];

  /**
   * Обновить значение фильтра
   */
  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Сбросить все фильтры
   */
  const handleReset = () => {
    setFilters({
      type: "all",
      genre: "",
      year: "",
      rating: "",
      sortBy: "popularity.desc",
      animeOnly: false,
    });
  };

  /**
   * Применить фильтры
   */
  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          className="filter-panel"
          drag
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={constraints}
          dragElastic={0}
          dragMomentum={false}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {/* Заголовок */}
          <div
            className="filter-header"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: "grab" }}
          >
            <div className="filter-title">
              <Sliders size={20} />
              <h2>{t.filters}</h2>
            </div>
            <button
              className="filter-close"
              onClick={onClose}
              aria-label="Закрыть фильтры"
            >
              <X size={24} />
            </button>
          </div>

          {/* Содержимое фильтров */}
          <div className="filter-content">
            {/* Тип контента */}
            <div className="filter-section">
              <label className="filter-label">{t.contentType}</label>
              <div className="type-toggle">
                <button
                  className={`type-btn ${filters.type === "all" ? "active" : ""}`}
                  onClick={() => handleChange("type", "all")}
                >
                  <Globe size={16} />
                  {t.all}
                </button>
                <button
                  className={`type-btn ${
                    filters.type === "movie" ? "active" : ""
                  }`}
                  onClick={() => handleChange("type", "movie")}
                >
                  <Film size={16} />
                  {t.movies}
                </button>
                <button
                  className={`type-btn ${filters.type === "tv" ? "active" : ""}`}
                  onClick={() => handleChange("type", "tv")}
                >
                  <Tv size={16} />
                  {t.tv}
                </button>
              </div>
            </div>

            {/* Аниме фильтр */}
            <div className="filter-section">
              <label className="filter-label">{t.anime}</label>
              <label className="anime-toggle">
                <input
                  type="checkbox"
                  checked={filters.animeOnly}
                  onChange={(e) =>
                    handleChange("animeOnly", e.target.checked)
                  }
                  className="anime-checkbox"
                />
                <span className="checkbox-label">{t.animeOnly}</span>
              </label>
            </div>

            {/* Жанр */}
            <div className="filter-section">
              <label className="filter-label">{t.genre}</label>
              <div className="select-wrapper">
                <select
                  value={filters.genre}
                  onChange={(e) => handleChange("genre", e.target.value)}
                  className="styled-select"
                  disabled={loadingGenres}
                >
                  <option value="">{t.allGenres}</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Год */}
            <div className="filter-section">
              <label className="filter-label">{t.year}</label>
              <div className="select-wrapper">
                <select
                  value={filters.year}
                  onChange={(e) => handleChange("year", e.target.value)}
                  className="styled-select"
                >
                  <option value="">{t.allYears}</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Рейтинг */}
            <div className="filter-section">
              <label className="filter-label">
                <Star size={14} /> {t.rating}:{" "}
                <span className="rating-value">{filters.rating || "0"}</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={filters.rating}
                onChange={(e) => handleChange("rating", e.target.value)}
                className="filter-range"
              />
              <div className="range-labels">
                <span>0</span>
                <span>10</span>
              </div>
            </div>

            {/* Сортировка */}
            <div className="filter-section">
              <label className="filter-label">{t.sortBy}</label>
              <div className="select-wrapper">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleChange("sortBy", e.target.value)}
                  className="styled-select"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="filter-footer">
            <button className="filter-reset" onClick={handleReset}>
              <RotateCcw size={16} />
              {t.reset}
            </button>
            <button className="filter-apply" onClick={handleApply}>
              {t.apply}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;
