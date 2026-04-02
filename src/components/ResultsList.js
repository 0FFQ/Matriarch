import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';

const ResultsList = memo(({ results, imageBase, onSelect }) => {
  const isSingleResult = results.length === 1;

  const handleCardClick = (e, item) => {
    if (!e.target.closest('.kinopoisk-icon')) {
      e.preventDefault();
      onSelect(item.id, item.media_type);
    }
  };

  const getKinopoiskLink = (item) => {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').split('-')[0];
    const type = item.media_type === 'tv' ? 'сериал' : 'фильм';
    return `https://www.kinopoisk.ru/search/?query=${encodeURIComponent(`${title} ${year} ${type}`)}`;
  };

  const formatYear = (dateString) => {
    if (!dateString) return '';
    const year = dateString.split('-')[0];
    return year;
  };

  const formatRating = (value) => {
    if (!value) return 'N/A';
    return value.toFixed(1);
  };

  return (
    <motion.div
      className={isSingleResult ? 'results-list-single' : 'results-list'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.05 }}
    >
      {results.slice(0, 10).map((item, idx) => (
        <motion.a
          key={item.id}
          href={getKinopoiskLink(item)}
          target="_blank"
          rel="noopener noreferrer"
          className={`result-card ${isSingleResult ? 'result-card-large' : ''}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          transition={{ delay: idx * 0.05 }}
          onClick={(e) => handleCardClick(e, item)}
        >
          <div className="poster-wrapper">
            <img src={`${imageBase}${item.poster_path}`} alt={item.title || item.name} loading="lazy" />
            <div className="kinopoisk-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h2v8H8V8zm4 0h2v8h-2V8zm4 0h-2v8h2V8z"/>
              </svg>
            </div>
          </div>
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
  );
});

export default ResultsList;
