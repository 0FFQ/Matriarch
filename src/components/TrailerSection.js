import React from 'react';
import { AnimatePresence } from 'framer-motion';
import TrailerPlayer from './TrailerPlayer';
import NoTrailerWidget from './NoTrailerWidget';

/**
 * Компонент секции трейлеров
 * @param {Object} trailer - объект трейлера
 * @param {Object} controls - объект обработчиков
 * @param {function} setSearchActive - функция установки активности поиска
 * @param {Object} t - объект с переводами
 */
const TrailerSection = ({ trailer, controls, setSearchActive, t }) => {
  return (
    <>
      {/* Трейлер */}
      <AnimatePresence>
        {trailer.selectedTrailer && (
          <TrailerPlayer
            trailer={trailer.selectedTrailer}
            onClose={controls.handleCloseTrailer}
            setSearchActive={setSearchActive}
          />
        )}
      </AnimatePresence>

      {/* Виджет "Трейлер не найден" */}
      <NoTrailerWidget
        movie={trailer.currentMovie}
        onClose={controls.handleCloseNoTrailer}
        t={t}
      />
    </>
  );
};

export default TrailerSection;
