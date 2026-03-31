import React, { memo } from 'react';
import { motion } from 'framer-motion';

const ResultsList = memo(({ results, imageBase, onSelect }) => {
  const isSingleResult = results.length === 1;

  const getKinopoiskLink = (item) => {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').split('-')[0];
    const type = item.media_type === 'tv' ? 'сериал' : 'фильм';
    return `https://www.kinopoisk.ru/search/?query=${encodeURIComponent(`${title} ${year} ${type}`)}`;
  };

  const handleCardClick = (e, item) => {
    if (!e.target.closest('.kinopoisk-icon')) {
      e.preventDefault();
      onSelect(item.id, item.media_type);
    }
  };

  return (
    <motion.div
      className={isSingleResult ? 'results-list-single' : 'results-list'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.05 }}
    >
      {results.slice(0, 10).map((item, idx) => (
        <motion.div
          key={item.id}
          className={`result-card ${isSingleResult ? 'result-card-large' : ''}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          transition={{ delay: idx * 0.05 }}
          onClick={(e) => handleCardClick(e, item)}
        >
          <div className="poster-wrapper">
            <img src={`${imageBase}${item.poster_path}`} alt={item.title || item.name} loading="lazy" />
            <a
              href={getKinopoiskLink(item)}
              target="_blank"
              rel="noopener noreferrer"
              className="kinopoisk-icon"
              title="На Кинопоиске"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h2v8H8V8zm4 0h2v8h-2V8zm4 0h-2v8h2V8z"/>
              </svg>
            </a>
          </div>
          <h3>{item.title || item.name}</h3>
          <p>{item.release_date || item.first_air_date}</p>
        </motion.div>
      ))}
    </motion.div>
  );
});

export default ResultsList;
