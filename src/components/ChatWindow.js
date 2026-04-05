import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { ArrowLeft, Send, MessageSquare, X, SendHorizonal } from 'lucide-react';
import { subscribeToMessages, sendMessage, markMessagesAsRead } from '../firebase/messages';
import { useUser } from '../context/UserContext';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ chatId, otherUser, onBack, t, isOpen, onClose }) => {
  const { firebaseUser, profile } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const dragControls = useDragControls();
  const panelRef = useRef(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const panelHeight = panelRef.current.offsetHeight;
      setConstraints({
        left: -(window.innerWidth - 500),
        right: 0,
        top: 0,
        bottom: Math.max(0, window.innerHeight - 32 - panelHeight)
      });
    }
  }, [isOpen]);

  // Обработка Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Подписка на сообщения
  useEffect(() => {
    if (!chatId || !isOpen) return;

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
        try { unsubscribe(); } catch (error) {}
        unsubscribe = null;
      }
      setMessages([]);
    };
  }, [chatId, isOpen]);

  // Автоматическая прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Пометить сообщения как прочитанные при открытии чата
  useEffect(() => {
    if (chatId && firebaseUser && isOpen) {
      markMessagesAsRead(chatId, firebaseUser.uid);
    }
  }, [chatId, firebaseUser, isOpen]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Отправка сообщения
  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !firebaseUser || !profile || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(chatId, firebaseUser.uid, profile, newMessage);
      setNewMessage('');
      setTimeout(() => inputRef.current?.focus(), 50);
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
  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach((msg) => {
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          className="chat-window"
          drag
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={constraints}
          dragElastic={0}
          dragMomentum={false}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Заголовок чата */}
          <div
            className="chat-window-header"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: 'grab' }}
          >
            <div className="chat-window-user">
              <button className="chat-back-btn" onClick={onBack}>
                <ArrowLeft size={20} />
              </button>
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
            <button className="chat-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          {/* Сообщения */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">
                  <MessageSquare size={48} />
                </div>
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
              placeholder={t.typeMessage || 'Сообщение'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={2000}
            />
            <div className="chat-send-wrapper">
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!newMessage.trim() || isSending}
              >
                {isSending ? (
                  <div className="sending-spinner" />
                ) : (
                  <SendHorizonal size={20} />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatWindow;
