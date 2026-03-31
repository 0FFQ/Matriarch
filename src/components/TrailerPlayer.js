import React from 'react';
import YouTube from 'react-youtube';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const TrailerPlayer = ({ trailer, onClose, setSearchActive }) => {
  const opts = {
    width: '100%',
    height: '500px',
    playerVars: { autoplay: 1 }
  };

  const handleClose = () => {
    onClose();
    setSearchActive(true);
  };

  return (
    <motion.div
      className="trailer-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="trailer-container">
        <button className="close-btn" onClick={handleClose}>
          <X size={32} />
        </button>
        <h2>{trailer.title}</h2>
        <YouTube videoId={trailer.key} opts={opts} />
      </div>
    </motion.div>
  );
};

export default TrailerPlayer;
