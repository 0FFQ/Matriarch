import React from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck, Trash2 } from "lucide-react";
import SharedContentBubble from "./SharedContentBubble";

/**
 * Пузырь сообщения
 * @param {function} props.onContextMenu - Обработчик ПКМ (из родителя)
 */
const MessageBubble = ({ message, isOwn, formatTime, onOpenContent, onContextMenu }) => {
  const hasSharedContent = message.contentType === "shared_media" && message.content;

  return (
    <motion.div
      className={`message-bubble ${isOwn ? "own" : "other"}`}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onContextMenu={onContextMenu}
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

        {/* Мета-информация */}
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
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
