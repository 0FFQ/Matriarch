import React, { useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Sun, Moon, X, Globe, Trash2, Database, User } from 'lucide-react';
import { useDraggablePosition } from '../hooks/useDraggablePosition';

const Sidebar = ({ isOpen, onClose, darkMode, onToggleTheme, language, onToggleLanguage, t, cacheStats, onClearCache, onOpenProfile }) => {
  const dragControls = useDragControls();
  const { position, savePosition } = useDraggablePosition('matriarch_sidebar_pos', isOpen);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="sidebar"
          drag
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ left: -window.innerWidth + 320, right: window.innerWidth - 320, top: -window.innerHeight + 100, bottom: window.innerHeight - 100 }}
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
            className="sidebar-header"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: 'grab' }}
          >
            <h2>{t.menu}</h2>
            <button className="sidebar-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div className="sidebar-content">
            <div className="menu-section">
              <button className="menu-item profile-menu-item" onClick={onOpenProfile}>
                <User size={20} />
                <span>{t.profile || 'Профиль'}</span>
              </button>
            </div>
            <div className="menu-section">
              <h3>{t.settings}</h3>
              <button className="menu-item" onClick={onToggleTheme}>
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span>{darkMode ? t.lightTheme : t.darkTheme}</span>
              </button>
              <button className="menu-item" onClick={onToggleLanguage}>
                <Globe size={20} />
                <span>{t.language}</span>
              </button>
            </div>
            
            {cacheStats && (
              <div className="menu-section">
                <h3>
                  <Database size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  {t.cache}
                </h3>
                <div className="cache-stats">
                  <div className="cache-stat">
                    <span className="cache-stat-label">{t.cacheActive}</span>
                    <span className="cache-stat-value">{cacheStats.activeItems}</span>
                  </div>
                  <div className="cache-stat">
                    <span className="cache-stat-label">{t.cacheSize}</span>
                    <span className="cache-stat-value">{cacheStats.totalSizeKB} KB</span>
                  </div>
                </div>
                <button className="menu-item cache-clear" onClick={onClearCache}>
                  <Trash2 size={20} />
                  <span>{t.cacheClear}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
