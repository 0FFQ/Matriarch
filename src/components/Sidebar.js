import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, X, Globe, Trash2, Database, User } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, darkMode, onToggleTheme, language, onToggleLanguage, t, cacheStats, onClearCache, onOpenProfile }) => {
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
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="sidebar-header">
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
