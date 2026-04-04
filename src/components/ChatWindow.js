import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToMessages, sendMessage, markMessagesAsRead } from '../firebase/messages';
import { useUser } from '../context/UserContext';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ chatId, otherUser, onBack, t }) => {
  const { firebaseUser, profile } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Подписка на сообщения
  useEffect(() => {
    if (!chatId) return;

    let unsubscribe = null;
    let isSubscribed = true;

    const setupSubscription = async () => {
      try {
        unsubscribe = subscribeToMessages(chatId, (messagesData) => {
          if (isSubscribed) {
            setMessages(messagesData);
          }
        });
      } catch (error) {
        console.error('[ChatWindow] Subscription setup error:', error);
      }
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('[ChatWindow] Unsubscribe error:', error);
        }
        unsubscribe = null;
      }
      // Принудительно очищаем состояние
      setMessages([]);
    };
  }, [chatId]);

  // Автоматическая прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Пометить сообщения как прочитанные при открытии чата
  useEffect(() => {
    if (chatId && firebaseUser) {
      markMessagesAsRead(chatId, firebaseUser.uid);
    }
  }, [chatId, firebaseUser]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Отправка сообщения
  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !firebaseUser || !profile || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(chatId, firebaseUser.uid, profile, newMessage);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('[ChatWindow] Send error:', error);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, firebaseUser, profile, chatId, isSending]);

  // Отправка по Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Форматирование времени сообщения
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  // Группировка сообщений по дате
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((msg) => {
      const date = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
      const dateKey = date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <motion.div
      className="chat-window"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* Заголовок чата */}
      <div className="chat-window-header">
        <button className="chat-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="chat-window-user">
          <div className="chat-window-avatar">
            {otherUser.avatar ? (
              <img src={otherUser.avatar} alt={otherUser.name} />
            ) : (
              <div className="chat-window-avatar-placeholder">
                {(otherUser.name || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="chat-window-info">
            <div className="chat-window-name">{otherUser.name || otherUser.email}</div>
            <div className="chat-window-status">
              {messages.length > 0 ? 'онлайн' : 'не в сети'}
            </div>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <p>{t.noMessagesYet || 'Пока нет сообщений'}</p>
            <p className="chat-empty-hint">
              {t.startConversation || 'Начните общение!'}
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="chat-messages-group">
              <div className="chat-date-divider">
                <span>{date}</span>
              </div>
              <AnimatePresence>
                {dateMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === firebaseUser?.uid}
                    formatTime={formatMessageTime}
                  />
                ))}
              </AnimatePresence>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder={t.typeMessage || 'Введите сообщение...'}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={2000}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <div className="sending-spinner" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ChatWindow;
