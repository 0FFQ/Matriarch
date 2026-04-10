import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Repeat, Copy, X, Check, CheckCheck } from 'lucide-react';

/**
 * Панель действий для выбранных сообщений
 * Показывается когда выбрано хотя бы одно сообщение
 */
const SelectionActionsBar = ({
  isVisible,
  selectedCount,
  ownCount,
  othersCount,
  onClose,
  onDeleteLocal,
  onDeleteEveryone,
  onForward,
  onCopyText,
  canDeleteEveryone = false,
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="selection-actions-bar"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="selection-info">
            <div className="selection-count">
              {selectedCount} {selectedCount === 1 ? 'сообщение' : 'сообщений'}
            </div>
            <div className="selection-breakdown">
              {ownCount > 0 && (
                <span className="selection-own">
                  <CheckCheck size={12} /> {ownCount} своих
                </span>
              )}
              {othersCount > 0 && (
                <span className="selection-others">
                  {othersCount} чужих
                </span>
              )}
            </div>
          </div>

          <div className="selection-actions">
            {/* Копировать текст */}
            {selectedCount > 0 && (
              <button
                className="selection-action-btn"
                onClick={onCopyText}
                title="Копировать текст"
              >
                <Copy size={18} />
                <span className="selection-action-label">Копировать</span>
              </button>
            )}

            {/* Переслать */}
            <button
              className="selection-action-btn"
              onClick={onForward}
              title="Переслать выбранные"
            >
              <Repeat size={18} />
              <span className="selection-action-label">Переслать</span>
            </button>

            {/* Удалить */}
            {canDeleteEveryone && ownCount > 0 ? (
              <button
                className="selection-action-btn selection-action-danger"
                onClick={onDeleteEveryone}
                title="Удалить у всех (свои сообщения)"
              >
                <Trash2 size={18} />
                <span className="selection-action-label">Удалить у всех</span>
              </button>
            ) : ownCount > 0 ? (
              <button
                className="selection-action-btn selection-action-danger"
                onClick={onDeleteEveryone}
                title="Удалить свои сообщения у всех"
              >
                <Trash2 size={18} />
                <span className="selection-action-label">Удалить у всех</span>
              </button>
            ) : null}

            {othersCount > 0 && (
              <button
                className="selection-action-btn selection-action-warning"
                onClick={onDeleteLocal}
                title="Удалить чужие сообщения у себя"
              >
                <Trash2 size={18} />
                <span className="selection-action-label">Удалить у себя</span>
              </button>
            )}

            {/* Закрыть режим выбора */}
            <button
              className="selection-close-btn"
              onClick={onClose}
              title="Закрыть выбор"
            >
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SelectionActionsBar;
