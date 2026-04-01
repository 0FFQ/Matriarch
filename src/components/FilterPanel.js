import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, RotateCcw } from 'lucide-react';

const FilterPanel = ({ 
  isOpen, 
  onClose, 
  filters, 
  setFilters, 
  onApply, 
  genres, 
  loadingGenres 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const defaultFilters = {
      type: 'all',
      genre: '',
      yearFrom: '',
      yearTo: '',
      rating: '',
      sortBy: 'popularity.desc',
      animeOnly: false
    };
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  const handleApply = () => {
    setFilters(localFilters);
    onApply(localFilters);
    onClose();
  };

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
                    className={`type-btn ${localFilters.type === 'all' ? 'active' : ''}`}
                    onClick={() => handleChange('type', 'all')}
                  >
                    Все
                  </button>
                  <button
                    className={`type-btn ${localFilters.type === 'movie' ? 'active' : ''}`}
                    onClick={() => handleChange('type', 'movie')}
                  >
                    Фильмы
                  </button>
                  <button
                    className={`type-btn ${localFilters.type === 'tv' ? 'active' : ''}`}
                    onClick={() => handleChange('type', 'tv')}
                  >
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
                    checked={localFilters.animeOnly}
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
                <div className="custom-select-wrapper">
                  <select
                    value={localFilters.genre}
                    onChange={(e) => handleChange('genre', e.target.value)}
                    className="filter-select custom-select"
                    disabled={loadingGenres}
                  >
                    <option value="">Все жанры</option>
                    {genres.map(genre => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Годы */}
              <div className="filter-section">
                <label className="filter-label">Год выпуска</label>
                <div className="year-range">
                  <div className="custom-select-wrapper">
                    <select
                      value={localFilters.yearFrom}
                      onChange={(e) => handleChange('yearFrom', e.target.value)}
                      className="filter-select year-select custom-select"
                    >
                      <option value="">От</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <span className="year-separator">—</span>
                  <div className="custom-select-wrapper">
                    <select
                      value={localFilters.yearTo}
                      onChange={(e) => handleChange('yearTo', e.target.value)}
                      className="filter-select year-select custom-select"
                    >
                      <option value="">До</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Сортировка */}
              <div className="filter-section">
                <label className="filter-label">Сортировка</label>
                <div className="custom-select-wrapper">
                  <select
                    value={localFilters.sortBy}
                    onChange={(e) => handleChange('sortBy', e.target.value)}
                    className="filter-select custom-select"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Рейтинг */}
              <div className="filter-section">
                <label className="filter-label">
                  Минимальный рейтинг: {localFilters.rating || '0'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={localFilters.rating}
                  onChange={(e) => handleChange('rating', e.target.value)}
                  className="filter-range"
                />
                <div className="range-labels">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
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
