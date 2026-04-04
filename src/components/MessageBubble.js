import React from 'react';
import { motion } from 'framer-motion';

const MessageBubble = ({ message, isOwn, formatTime }) => {
  return (
    <motion.div
      className={`message-bubble ${isOwn ? 'own' : 'other'}`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {!isOwn && (
        <div className="message-sender">
          {message.senderAvatar ? (
            <img src={message.senderAvatar} alt={message.senderName} className="message-avatar" />
          ) : (
            <div className="message-avatar-placeholder">
              {(message.senderName || '?')[0].toUpperCase()}
            </div>
          )}
          <span className="message-sender-name">{message.senderName}</span>
        </div>
      )}
      <div className="message-content">
        <p className="message-text">{message.text}</p>
        <div className="message-meta">
          <span className="message-time">{formatTime(message.createdAt)}</span>
          {isOwn && (
            <span className={`message-status ${message.read ? 'read' : 'sent'}`}>
              {message.read ? (
                // Две галочки (прочитано)
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M1 13l5 5L17 7"/>
                  <path d="M7 13l5 5L23 7"/>
                </svg>
              ) : (
                // Одна галочка (отправлено)
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
