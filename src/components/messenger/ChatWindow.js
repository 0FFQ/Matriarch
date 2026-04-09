import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { ArrowLeft, Send, MessageSquare, X, SendHorizonal } from 'lucide-react';
import { subscribeToMessages, sendMessage, markMessagesAsRead } from '../../firebase/messages';
import { subscribeToUserPresence } from '../../firebase/firestore';
import { useUser } from '../../context/UserContext';
import MessageBubble from './MessageBubble';
import { createPortal } from 'react-dom';

const ChatWindow = ({ chatId, otherUser, onBack, t, isOpen, onClose, onSelectContent }) => {
  const { firebaseUser, profile } = useUser();
  const [messages, setMessages] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, messageId }
  const [localDeleted, setLocalDeleted] = useState(new Set()); // ID удалённых только у себя
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
    if (!chatId || !isOpen) {
      setMessages(null);
      return;
    }

    let unsubscribe = null;
    let isSubscribed = true;

    // Сразу сбрасываем при смене чата
    setMessages(null);

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
      setMessages(null);
    };
  }, [chatId, isOpen]);

  // Автоматическая прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Подписка на онлайн-статус собеседника
  useEffect(() => {
    if (!otherUser?.id || !isOpen) {
      setIsOnline(false);
      return;
    }

    const unsubscribe = subscribeToUserPresence(otherUser.id, ({ isOnline }) => {
      setIsOnline(isOnline);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [otherUser?.id, isOpen]);

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

  // Удаление сообщения — только у себя (локально)
  const handleDeleteMessage = useCallback((messageId) => {
    setContextMenu(null);
    setLocalDeleted(prev => new Set([...prev, messageId]));
  }, []);

  // Контекстное меню — только для своих сообщений
  const handleContextMenu = useCallback((e, messageId) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || msg.senderId !== firebaseUser?.uid) return; // только свои
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId });
  }, [messages, firebaseUser]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Закрытие по клику вне
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    const handleEsc = (e) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu]);

  // Форматирование времени сообщения
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  // Группировка сообщений по дате
  const groupMessagesByDate = (msgs) => {
    if (!msgs) return {};
    const filtered = msgs.filter(m => !localDeleted.has(m.id));
    const groups = {};
    filtered.forEach((msg) => {
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
    <>
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
                <div className={`chat-window-status ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? 'онлайн' : 'не в сети'}
                </div>
              </div>
            </div>
            <button className="chat-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          {/* Сообщения */}
          <div className="chat-messages">
            {messages === null ? (
              <div className="chat-loading">
                <div className="chat-loading-spinner" />
                <p>Загрузка...</p>
              </div>
            ) : messages.length === 0 ? (
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
                        onOpenContent={onSelectContent}
                        onContextMenu={(e) => handleContextMenu(e, message.id)}
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

    {/* Контекстное меню удаления — портал в body */}
    {createPortal(
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            className="msg-context-menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{ top: contextMenu.y - 36, left: contextMenu.x - 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="msg-context-menu-item msg-context-menu-delete"
              onClick={() => handleDeleteMessage(contextMenu.messageId)}
            >
              Удалить
            </button>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
};

export default ChatWindow;
