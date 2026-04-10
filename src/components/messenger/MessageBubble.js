import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import SharedContentBubble from "./SharedContentBubble";

/**
 * Пузырь сообщения
 * @param {function} props.onContextMenu - Обработчик ПКМ (из родителя)
 * @param {boolean} props.isSelectionMode - Режим выбора сообщений
 * @param {boolean} props.isSelected - Выбрано ли сообщение
 */
const MessageBubble = ({
  message,
  isOwn,
  formatTime,
  onOpenContent,
  onContextMenu,
  isSelectionMode = false,
  isSelected = false,
}) => {
  const hasSharedContent = message.contentType === "shared_media" && message.content;
  const isForwarded = message.forwardedFrom && message.forwardedFrom.name;
  const [isNoSelect, setIsNoSelect] = useState(false);
  const noSelectTimerRef = useRef(null);

  const handleTextPointerDown = (e) => {
    if (isSelectionMode) {
      // Показываем знак запрета при зажатии в режиме выбора
      setIsNoSelect(true);
      noSelectTimerRef.current = setTimeout(() => {
        setIsNoSelect(false);
        noSelectTimerRef.current = null;
      }, 600);
    }
  };

  const handleTextPointerUp = () => {
    if (noSelectTimerRef.current) {
      clearTimeout(noSelectTimerRef.current);
      noSelectTimerRef.current = null;
      setIsNoSelect(false);
    }
  };

  const handleClick = (e) => {
    // Клик не делает ничего
  };

  return (
    <motion.div
      className={`message-bubble ${isOwn ? "own" : "other"} ${isSelectionMode ? "selectable" : ""} ${isSelected ? "selected" : ""} ${isNoSelect ? "no-select-cursor" : ""}`}
      data-message-id={message.id}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onContextMenu={onContextMenu}
      onClick={handleClick}
    >
      {/* Аватар отправителя (для чужих сообщений) */}
      {!isOwn && (
        <div
          className="message-sender"
          onPointerDown={handleTextPointerDown}
          onPointerUp={handleTextPointerUp}
          onPointerLeave={handleTextPointerUp}
        >
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
          <div
            className="message-forwarded-header"
            style={isNoSelect ? { cursor: 'default' } : undefined}
            onPointerDown={handleTextPointerDown}
            onPointerUp={handleTextPointerUp}
            onPointerLeave={handleTextPointerUp}
          >
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
            isSelectionMode={isSelectionMode}
            isSelected={isSelected}
          />
        )}

        {/* Текстовое сообщение */}
        {message.text && (
          <p
            className="message-text"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={handleTextPointerDown}
            onPointerUp={handleTextPointerUp}
            onPointerLeave={handleTextPointerUp}
          >
            {message.text}
          </p>
        )}

        {/* Мета-информация и чекбокс справа */}
        <div className="message-meta">
          <span
            className="message-time"
            onPointerDown={handleTextPointerDown}
            onPointerUp={handleTextPointerUp}
            onPointerLeave={handleTextPointerUp}
          >
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
