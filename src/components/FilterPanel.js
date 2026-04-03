import React, { useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Sliders, RotateCcw, Film, Tv, Globe, Star } from 'lucide-react';
import { useDraggablePosition } from '../hooks/useDraggablePosition';

const FilterPanel = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
  genres,
  loadingGenres,
  t
}) => {
  const dragControls = useDragControls();
  const { position, savePosition } = useDraggablePosition('matriarch_filter_pos', isOpen);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Обработка клавиши Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const sortOptions = [
    { value: 'popularity.desc', label: t.byPopularity },
    { value: 'vote_average.desc', label: t.byRating },
    { value: 'primary_release_date.desc', label: t.byDateNew },
    { value: 'primary_release_date.asc', label: t.byDateOld },
    { value: 'title.asc', label: t.byTitleAZ },
    { value: 'title.desc', label: t.byTitleZA }
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
        <motion.div
            className="filter-panel"
            drag
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ left: -window.innerWidth + 400, right: window.innerWidth - 400, top: -window.innerHeight + 100, bottom: window.innerHeight - 100 }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              const newX = (position?.x || 0) + info.offset.x;
              const newY = (position?.y || 0) + info.offset.y;
              savePosition(newX, newY);
            }}
            initial={false}
            animate={position ? { x: position.x, y: position.y, opacity: 1 } : { x: 0, y: 0, opacity: 0 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ position: 'fixed' }}
          >
            <div
              className="filter-header"
              onPointerDown={(e) => dragControls.start(e)}
              style={{ cursor: 'grab' }}
            >
              <div className="filter-title">
                <Sliders size={20} />
                <h2>{t.filters}</h2>
              </div>
              <button className="filter-close" onClick={onClose}>
                <X size={24} />
              </button>
            </div>

            <div className="filter-content">
              {/* Тип контента */}
              <div className="filter-section">
                <label className="filter-label">{t.contentType}</label>
                <div className="type-toggle">
                  <button
                    className={`type-btn ${filters.type === 'all' ? 'active' : ''}`}
                    onClick={() => handleChange('type', 'all')}
                  >
                    <Globe size={16} />
                    {t.all}
                  </button>
                  <button
                    className={`type-btn ${filters.type === 'movie' ? 'active' : ''}`}
                    onClick={() => handleChange('type', 'movie')}
                  >
                    <Film size={16} />
                    {t.movies}
                  </button>
                  <button
                    className={`type-btn ${filters.type === 'tv' ? 'active' : ''}`}
                    onClick={() => handleChange('type', 'tv')}
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
                    onChange={(e) => handleChange('animeOnly', e.target.checked)}
                    className="anime-checkbox"
                  />
                  <span className="checkbox-label">
                    {t.animeOnly}
                  </span>
                </label>
              </div>

              {/* Жанр */}
              <div className="filter-section">
                <label className="filter-label">{t.genre}</label>
                <div className="select-wrapper">
                  <select
                    value={filters.genre}
                    onChange={(e) => handleChange('genre', e.target.value)}
                    className="styled-select"
                    disabled={loadingGenres}
                  >
                    <option value="">{t.allGenres}</option>
                    {genres.map(genre => (
                      <option key={genre.id} value={genre.id}>{genre.name}</option>
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
                    onChange={(e) => handleChange('year', e.target.value)}
                    className="styled-select"
                  >
                    <option value="">{t.allYears}</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Рейтинг */}
              <div className="filter-section">
                <label className="filter-label">
                  <Star size={14} /> {t.rating}: <span className="rating-value">{filters.rating || '0'}</span>
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
                <label className="filter-label">{t.sortBy}</label>
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
