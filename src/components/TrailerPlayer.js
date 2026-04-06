import React, { memo, useCallback, useMemo, useEffect } from "react";
import YouTube from "react-youtube";
import { motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * Проигрыватель трейлеров (YouTube)
 */
const TrailerPlayer = memo(({ trailer, onClose, setSearchActive }) => {
  // Настройки плеера
  const opts = useMemo(
    () => ({
      width: "100%",
      height: "500px",
      playerVars: { autoplay: 1 },
    }),
    []
  );

  // Закрытие трейлера
  const handleClose = useCallback(() => {
    onClose();
    setSearchActive(true);
  }, [onClose, setSearchActive]);

  // Обработка Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  return (
    <motion.div
      className="trailer-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="trailer-container">
        <button
          className="close-btn"
          onClick={handleClose}
          aria-label="Закрыть трейлер"
        >
          <X size={32} />
        </button>
        <h2>{trailer.title}</h2>
        <YouTube videoId={trailer.key} opts={opts} />
      </div>
    </motion.div>
  );
});

export default TrailerPlayer;
