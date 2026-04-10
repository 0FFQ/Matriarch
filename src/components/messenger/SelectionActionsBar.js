import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Панель действий для выбранных сообщений
 * Показывается под заголовком чата
 */
const SelectionActionsBar = ({
  isVisible,
  selectedCount,
  onClose,
  onDeleteEveryone,
  onForward,
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="selection-actions-topbar"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <div className="selection-actions-topbar-buttons">
            <div className="selection-actions-left">
              {/* Переслать */}
              <button
                className="selection-topbar-btn"
                onClick={onForward}
                title="Переслать"
              >
                <span>Переслать</span>
                <span className="selection-btn-count">{selectedCount}</span>
              </button>

              {/* Удалить */}
              <button
                className="selection-topbar-btn selection-danger-btn"
                onClick={onDeleteEveryone}
                title="Удалить"
              >
                <span>Удалить</span>
                <span className="selection-btn-count">{selectedCount}</span>
              </button>
            </div>

            {/* Отменить */}
            <button
              className="selection-topbar-btn selection-cancel-btn"
              onClick={onClose}
              title="Отменить"
            >
              <span>Отменить</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SelectionActionsBar;
