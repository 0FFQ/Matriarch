import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Sun,
  Moon,
  X,
  Globe,
  Trash2,
  Database,
  User,
  Eye,
} from "lucide-react";
import useWindowPosition from "../hooks/useWindowPosition";

/**
 * Боковое меню (Sidebar)
 */
const Sidebar = ({
  isOpen,
  onClose,
  darkMode,
  onToggleTheme,
  language,
  onToggleLanguage,
  t,
  cacheStats,
  onClearCache,
  onOpenProfile,
  atomVisible,
  onToggleAtom,
}) => {
  const dragControls = useDragControls();
  const panelRef = useRef(null);
  const [constraints, setConstraints] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });

  // Сохранение позиции окна
  const { x, y, handleDragStart, handleDragEnd, resetPosition } = useWindowPosition(
    "sidebar",
    isOpen
  );

  // Вычисляем ограничения для перетаскивания
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const headerEl = panelRef.current.querySelector('.sidebar-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 70;
      const panelHeight = panelRef.current.offsetHeight;
      const initialTop = 16;
      // Панель может опуститься так, чтобы header остался виден снизу
      // translateY max = window.innerHeight - initialTop - headerHeight
      const maxTranslateY = window.innerHeight - initialTop - headerHeight;
      setConstraints({
        left: -(window.innerWidth - 360),
        right: 0,
        top: -(initialTop),
        bottom: Math.max(0, maxTranslateY),
      });
    }
  }, [isOpen]);

  // Обработка Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence mode="sync">
      {isOpen && (
        <motion.div
          ref={panelRef}
          className="sidebar"
          drag
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={constraints}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={{ x, y }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transitionEnd: { x: 0, y: 0 } }}
          transition={{ duration: 0.25 }}
        >
          {/* Заголовок */}
          <div
            className="sidebar-header"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: "grab" }}
          >
            <h2>{t.menu}</h2>
            <button
              className="sidebar-close"
              onClick={onClose}
              aria-label="Закрыть меню"
            >
              <X size={24} />
            </button>
          </div>

          {/* Содержимое */}
          <div className="sidebar-content">
            {/* Профиль */}
            <div className="menu-section">
              <button
                className="menu-item profile-menu-item"
                onClick={onOpenProfile}
              >
                <User size={20} />
                <span>{t.profile || "Профиль"}</span>
              </button>
            </div>

            {/* Настройки */}
            <div className="menu-section">
              <h3>{t.settings}</h3>
              <button
                className="menu-item"
                onClick={onToggleTheme}
                style={{ marginBottom: "8px" }}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span>{darkMode ? t.lightTheme : t.darkTheme}</span>
              </button>
              <button
                className="menu-item"
                onClick={onToggleAtom}
                style={{ marginBottom: "8px" }}
              >
                <Eye size={20} />
                <span>{atomVisible ? t.hideAtom : t.showAtom}</span>
              </button>
              <button className="menu-item" onClick={onToggleLanguage}>
                <Globe size={20} />
                <span>{t.language}</span>
              </button>
            </div>

            {/* Статистика кэша */}
            {cacheStats && (
              <div className="menu-section">
                <h3>
                  <Database
                    size={16}
                    style={{ marginRight: "8px", verticalAlign: "middle" }}
                  />
                  {t.cache}
                </h3>
                <div className="cache-stats">
                  <div className="cache-stat">
                    <span className="cache-stat-label">
                      {t.cacheActive}
                    </span>
                    <span className="cache-stat-value">
                      {cacheStats.activeItems}
                    </span>
                  </div>
                  <div className="cache-stat">
                    <span className="cache-stat-label">{t.cacheSize}</span>
                    <span className="cache-stat-value">
                      {cacheStats.totalSizeKB} KB
                    </span>
                  </div>
                </div>
                <button
                  className="menu-item cache-clear"
                  onClick={onClearCache}
                >
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
