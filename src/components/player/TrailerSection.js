import React from 'react';
import { AnimatePresence } from 'framer-motion';
import TrailerPlayer from './TrailerPlayer';
import NoTrailerWidget from './NoTrailerWidget';


const TrailerSection = ({ trailer, controls, setSearchActive, t }) => {
  return (
    <>
      {}
      <AnimatePresence>
        {trailer.selectedTrailer && (
          <TrailerPlayer
            trailer={trailer.selectedTrailer}
            onClose={controls.handleCloseTrailer}
            setSearchActive={setSearchActive}
          />
        )}
      </AnimatePresence>

      {}
      <NoTrailerWidget
        movie={trailer.currentMovie}
        onClose={controls.handleCloseNoTrailer}
        t={t}
      />
    </>
  );
};

export default TrailerSection;
