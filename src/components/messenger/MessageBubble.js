import React from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import SharedContentBubble from "./SharedContentBubble";

/**
 * Пузырь сообщения
 * @param {function} props.onContextMenu - Обработчик ПКМ (из родителя)
 * @param {boolean} props.isSelectionMode - Режим выбора сообщений
 * @param {boolean} props.isSelected - Выбрано ли сообщение
 * @param {function} props.onToggleSelect - Переключить выбор сообщения
 * @param {function} props.onMouseDown - Нажатие ЛКМ (для drag-выбора)
 * @param {function} props.onMouseEnter - Наведение (для drag-выбора)
 */
const MessageBubble = ({
  message,
  isOwn,
  formatTime,
  onOpenContent,
  onContextMenu,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onMouseDown,
  onMouseEnter,
}) => {
  const hasSharedContent = message.contentType === "shared_media" && message.content;
  const isForwarded = message.forwardedFrom && message.forwardedFrom.name;

  const handleClick = (e) => {
    if (isSelectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(message.id);
    }
  };

  return (
    <motion.div
      className={`message-bubble ${isOwn ? "own" : "other"} ${isSelectionMode ? "selectable" : ""}`}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onContextMenu={onContextMenu}
      onClick={handleClick}
      onMouseDown={(e) => {
        if (isSelectionMode && onMouseDown) {
          onMouseDown(message.id);
        }
      }}
      onMouseEnter={() => {
        if (isSelectionMode && onMouseEnter) {
          onMouseEnter(message.id);
        }
      }}
    >
      {/* Аватар отправителя (для чужих сообщений) */}
      {!isOwn && (
        <div className="message-sender">
          {message.senderAvatar ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="message-avatar"
            />
          ) : (
            <div className="message-avatar-placeholder">
              {(message.senderName || "?")[0].toUpperCase()}
            </div>
          )}
          <span className="message-sender-name">{message.senderName}</span>
        </div>
      )}

      <div className="message-content">
        {/* Заголовок пересланного сообщения */}
        {isForwarded && (
          <div className="message-forwarded-header">
            <span className="message-forwarded-text">
              Переслано от
            </span>
            {message.forwardedFrom.avatar ? (
              <img
                src={message.forwardedFrom.avatar}
                alt={message.forwardedFrom.name}
                className="message-forwarded-avatar"
              />
            ) : (
              <div className="message-forwarded-avatar-placeholder">
                {(message.forwardedFrom.name || '?')[0].toUpperCase()}
              </div>
            )}
            <span className="message-forwarded-name">
              {message.forwardedFrom.name}
            </span>
          </div>
        )}

        {/* Прикреплённый контент (если есть) */}
        {hasSharedContent && (
          <SharedContentBubble
            content={message.content}
            isOwn={isOwn}
            onOpenOnSite={onOpenContent}
          />
        )}

        {/* Текстовое сообщение */}
        {message.text && (
          <p className="message-text">{message.text}</p>
        )}

        {/* Мета-информация и чекбокс справа */}
        <div className="message-meta">
          <span className="message-time">
            {formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <span
              className={`message-status ${
                message.read ? "read" : "sent"
              }`}
            >
              {message.read ? (
                <CheckCheck size={14} />
              ) : (
                <Check size={14} />
              )}
            </span>
          )}

          {/* Круглый чекбокс справа */}
          {isSelectionMode && (
            <div
              className={`message-select-circle ${isSelected ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.(message.id);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <polyline
                  points="2 7 5.5 10.5 12 3.5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
