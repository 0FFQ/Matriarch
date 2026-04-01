import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, RotateCcw, Film, Tv, Globe, Star } from 'lucide-react';

const FilterPanel = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
  genres,
  loadingGenres
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const sortOptions = [
    { value: 'popularity.desc', label: 'По популярности' },
    { value: 'vote_average.desc', label: 'По рейтингу' },
    { value: 'primary_release_date.desc', label: 'По дате (новые)' },
    { value: 'primary_release_date.asc', label: 'По дате (старые)' },
    { value: 'title.asc', label: 'По названию (А-Я)' },
    { value: 'title.desc', label: 'По названию (Я-А)' }
  ];

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters({
      type: 'all',
      genre: '',
      year: '',
      rating: '',
      sortBy: 'popularity.desc',
      animeOnly: false
    });
  };

  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="filter-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="filter-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="filter-header">
              <div className="filter-title">
                <Sliders size={20} />
                <h2>Фильтры</h2>
              </div>
              <button className="filter-close" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            <div className="filter-content">
              {/* Тип контента */}
              <div className="filter-section">
                <label className="filter-label">Тип контента</label>
                <div className="type-toggle">
                  <button
                    className={`type-btn ${filters.type === 'all' ? 'active' : ''}`}
                    onClick={() => handleChange('type', 'all')}
                  >
                    <Globe size={16} />
                    Все
                  </button>
                  <button
                    className={`type-btn ${filters.type === 'movie' ? 'active' : ''}`}
                    onClick={() => handleChange('type', 'movie')}
                  >
                    <Film size={16} />
                    Фильмы
                  </button>
                  <button
                    className={`type-btn ${filters.type === 'tv' ? 'active' : ''}`}
                    onClick={() => handleChange('type', 'tv')}
                  >
                    <Tv size={16} />
                    Сериалы
                  </button>
                </div>
              </div>

              {/* Аниме фильтр */}
              <div className="filter-section">
                <label className="filter-label">Аниме</label>
                <label className="anime-toggle">
                  <input
                    type="checkbox"
                    checked={filters.animeOnly}
                    onChange={(e) => handleChange('animeOnly', e.target.checked)}
                    className="anime-checkbox"
                  />
                  <span className="checkbox-label">
                    Только аниме (Япония + Анимация)
                  </span>
                </label>
              </div>

              {/* Жанр */}
              <div className="filter-section">
                <label className="filter-label">Жанр</label>
                <div className="select-wrapper">
                  <select
                    value={filters.genre}
                    onChange={(e) => handleChange('genre', e.target.value)}
                    className="styled-select"
                    disabled={loadingGenres}
                  >
                    <option value="">Все жанры</option>
                    {genres.map(genre => (
                      <option key={genre.id} value={genre.id}>{genre.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Год */}
              <div className="filter-section">
                <label className="filter-label">Год выпуска</label>
                <div className="select-wrapper">
                  <select
                    value={filters.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                    className="styled-select"
                  >
                    <option value="">Все годы</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Рейтинг */}
              <div className="filter-section">
                <label className="filter-label">
                  <Star size={14} /> Минимальный рейтинг: <span className="rating-value">{filters.rating || '0'}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={filters.rating}
                  onChange={(e) => handleChange('rating', e.target.value)}
                  className="filter-range"
                />
                <div className="range-labels">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>

              {/* Сортировка */}
              <div className="filter-section">
                <label className="filter-label">Сортировка</label>
                <div className="select-wrapper">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleChange('sortBy', e.target.value)}
                    className="styled-select"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="filter-footer">
              <button className="filter-reset" onClick={handleReset}>
                <RotateCcw size={16} />
                Сбросить
              </button>
              <button className="filter-apply" onClick={handleApply}>
                Применить
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;
