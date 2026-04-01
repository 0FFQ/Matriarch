import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, RotateCcw, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

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
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdown) {
        const triggerEl = dropdownRefs.current[openDropdown];
        if (triggerEl && !triggerEl.contains(e.target)) {
          setOpenDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

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

  const CustomSelect = ({ id, value, options, onChange, placeholder }) => {
    const triggerRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

    useEffect(() => {
      if (openDropdown === id && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 6,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, [openDropdown, id]);

    const handleSelect = (optionValue) => {
      onChange(optionValue);
      setOpenDropdown(null);
    };

    return (
      <>
        <div
          className="custom-select-wrapper"
          ref={el => {
            dropdownRefs.current[id] = el;
            triggerRef.current = el;
          }}
        >
          <div
            className={`custom-select-trigger ${openDropdown === id ? 'open' : ''}`}
            onClick={() => setOpenDropdown(openDropdown === id ? null : id)}
          >
            <span className="custom-select-value">{selectedLabel}</span>
            <ChevronDown size={18} className="custom-select-arrow" />
          </div>
        </div>
        {openDropdown === id && createPortal(
          <motion.div
            className="custom-select-dropdown"
            style={{
              top: position.top,
              left: position.left,
              width: position.width
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {options.map(option => (
              <div
                key={option.value}
                className={`custom-select-option ${value === option.value ? 'selected' : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
          </motion.div>,
          document.body
        )}
      </>
    );
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
                <CustomSelect
                  id="genre"
                  value={localFilters.genre}
                  onChange={(val) => handleChange('genre', val)}
                  placeholder="Все жанры"
                  options={[
                    { value: '', label: 'Все жанры' },
                    ...genres.map(genre => ({ value: genre.id, label: genre.name }))
                  ]}
                />
              </div>

              {/* Годы */}
              <div className="filter-section">
                <label className="filter-label">Год выпуска</label>
                <div className="year-range">
                  <CustomSelect
                    id="yearFrom"
                    value={localFilters.yearFrom}
                    onChange={(val) => handleChange('yearFrom', val)}
                    placeholder="От"
                    options={[
                      { value: '', label: 'От' },
                      ...years.map(year => ({ value: String(year), label: String(year) }))
                    ]}
                  />
                  <span className="year-separator">—</span>
                  <CustomSelect
                    id="yearTo"
                    value={localFilters.yearTo}
                    onChange={(val) => handleChange('yearTo', val)}
                    placeholder="До"
                    options={[
                      { value: '', label: 'До' },
                      ...years.map(year => ({ value: String(year), label: String(year) }))
                    ]}
                  />
                </div>
              </div>

              {/* Сортировка */}
              <div className="filter-section">
                <label className="filter-label">Сортировка</label>
                <CustomSelect
                  id="sortBy"
                  value={localFilters.sortBy}
                  onChange={(val) => handleChange('sortBy', val)}
                  placeholder="Сортировка"
                  options={sortOptions}
                />
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
