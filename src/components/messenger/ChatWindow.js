import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { ArrowLeft, Send, MessageSquare, X, SendHorizonal, Trash2, Repeat, MousePointerClick } from 'lucide-react';
import { subscribeToMessages, sendMessage, markMessagesAsRead, deleteMessage } from '../../firebase/messages';
import { subscribeToUserPresence } from '../../firebase/firestore';
import { useUser } from '../../context/UserContext';
import MessageBubble from './MessageBubble';
import { createPortal } from 'react-dom';
import ForwardModal from './ForwardModal';
import SelectionActionsBar from './SelectionActionsBar';
import useMessageSelection from '../../hooks/useMessageSelection';

const ChatWindow = ({ chatId, otherUser, onBack, t, isOpen, onClose, onSelectContent, onSwitchChat }) => {
  const { firebaseUser, profile } = useUser();
  const [messages, setMessages] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, messageId, message }
  const [deleteMenu, setDeleteMenu] = useState(null); // { x, y, messageId }
  const [localDeleted, setLocalDeleted] = useState(new Set()); // ID удалённых только у себя
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isMouseDraggingRef = useRef(false);

  // Система выбора сообщений
  const {
    selectedIds,
    selectedMessages,
    isSelectionMode,
    toggleMessage,
    selectMessage,
    deselectMessage,
    selectAll,
    deselectAll,
    enterSelectionMode,
    exitSelectionMode,
    isSelected,
    selectionStats,
  } = useMessageSelection(messages || []);

  // Глобальный mouseup — сброс drag
  useEffect(() => {
    const handleMouseUp = () => {
      isMouseDraggingRef.current = false;
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Начало drag-выбора (зажатие ЛКМ на сообщении)
  const handleMouseDown = useCallback((messageId) => {
    if (!isSelectionMode) return;
    isMouseDraggingRef.current = true;
    toggleMessage(messageId);
  }, [isSelectionMode, toggleMessage]);

  // Продолжение drag-выбора (наведение на сообщение при зажатой ЛКМ)
  const handleMouseEnterSelection = useCallback((messageId) => {
    if (!isMouseDraggingRef.current || !isSelectionMode) return;
    if (isSelected(messageId)) {
      deselectMessage(messageId);
    } else {
      selectMessage(messageId);
    }
  }, [isSelectionMode, isSelected, selectMessage, deselectMessage]);

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
  const handleDeleteLocal = useCallback((messageId) => {
    setDeleteMenu(null);
    setLocalDeleted(prev => new Set([...prev, messageId]));
  }, []);

  // Удаление сообщения — у всех (из Firestore)
  const handleDeleteEveryone = useCallback(async (messageId) => {
    if (!firebaseUser?.uid) return;
    setDeleteMenu(null);
    try {
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        await deleteMessage(messageId, msg.senderId, firebaseUser.uid);
      }
    } catch (error) {
      console.error('[ChatWindow] Delete everyone error:', error);
    }
  }, [firebaseUser, messages]);

  // Открыть меню выбора удаления
  const handleDeleteOptions = useCallback((messageId) => {
    // Используем координаты исходного контекстного меню
    if (contextMenu) {
      const msg = messages.find(m => m.id === messageId);
      const isOwn = msg && msg.senderId === firebaseUser?.uid;

      if (isOwn) {
        // Своё сообщение — показываем выбор
        setDeleteMenu({ x: contextMenu.x, y: contextMenu.y, messageId });
        setContextMenu(null);
      } else {
        // Чужое сообщение — сразу удаляем локально
        handleDeleteLocal(messageId);
        setContextMenu(null);
      }
    }
  }, [contextMenu, messages, firebaseUser, handleDeleteLocal]);

  // Контекстное меню — для любых сообщений
  const handleContextMenu = useCallback((e, messageId) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    const isOwn = msg.senderId === firebaseUser?.uid;
    e.preventDefault();
    setDeleteMenu(null);
    setContextMenu({ x: e.clientX, y: e.clientY, messageId, message: msg, isOwn });
  }, [messages, firebaseUser]);

  // Открыть модалку пересылки
  const handleForward = useCallback((messageId) => {
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      setForwardMessage(msg);
      setForwardModalOpen(true);
    }
    setContextMenu(null);
  }, [messages]);

  // Действия с выбранными сообщениями
  const handleSelectionForward = useCallback(() => {
    if (selectedMessages.length === 0) return;
    // Пересылаем первое выбранное сообщение
    setForwardMessage(selectedMessages[0]);
    setForwardModalOpen(true);
    exitSelectionMode();
  }, [selectedMessages, exitSelectionMode]);

  const handleSelectionCopyText = useCallback(() => {
    if (selectedMessages.length === 0) return;
    const texts = selectedMessages.map(m => m.text || '').filter(Boolean);
    const combinedText = texts.join('\n\n---\n\n');
    navigator.clipboard.writeText(combinedText);
    exitSelectionMode();
  }, [selectedMessages, exitSelectionMode]);

  const handleSelectionDeleteLocal = useCallback(() => {
    if (selectedMessages.length === 0) return;
    const othersIds = selectedMessages.filter(m => !m.isOwn).map(m => m.id);
    setLocalDeleted(prev => new Set([...prev, ...othersIds]));
    exitSelectionMode();
  }, [selectedMessages, exitSelectionMode]);

  const handleSelectionDeleteEveryone = useCallback(async () => {
    if (selectedMessages.length === 0 || !firebaseUser?.uid) return;
    const ownMessagesToDelete = selectedMessages.filter(m => m.isOwn);
    
    for (const msg of ownMessagesToDelete) {
      try {
        await deleteMessage(msg.id, msg.senderId, firebaseUser.uid);
      } catch (error) {
        console.error('[ChatWindow] Bulk delete error:', error);
      }
    }
    
    exitSelectionMode();
  }, [selectedMessages, firebaseUser, exitSelectionMode]);

  // Переключить режим выбора (долгий тап или кнопка)
  const handleToggleSelectionMode = useCallback(() => {
    if (isSelectionMode) {
      exitSelectionMode();
    } else {
      enterSelectionMode();
    }
  }, [isSelectionMode, enterSelectionMode, exitSelectionMode]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Закрытие по клику вне
  useEffect(() => {
    if (!contextMenu && !deleteMenu) return;
    const handleClick = () => {
      setContextMenu(null);
      setDeleteMenu(null);
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setDeleteMenu(null);
        if (forwardModalOpen) setForwardModalOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu, deleteMenu, forwardModalOpen]);

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
      // Пытаемся распарсить пересланное сообщение
      let parsedMsg = msg;
      try {
        const data = JSON.parse(msg.text);
        if (data.forwardedFrom) {
          parsedMsg = { ...msg, text: data.text, forwardedFrom: data.forwardedFrom };
        }
      } catch {
        // Обычное сообщение
      }
      const date = parsedMsg.createdAt?.toDate ? parsedMsg.createdAt.toDate() : new Date();
      const dateKey = date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(parsedMsg);
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
            <div className="chat-window-actions">
              {/* Кнопка выбора сообщений */}
              <button 
                className={`chat-select-btn ${isSelectionMode ? 'active' : ''}`}
                onClick={handleToggleSelectionMode}
                title={isSelectionMode ? 'Завершить выбор' : 'Выбрать сообщения'}
              >
                <MousePointerClick size={20} />
              </button>
              <button className="chat-close-btn" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
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
                        isSelectionMode={isSelectionMode}
                        isSelected={isSelected(message.id)}
                        onToggleSelect={toggleMessage}
                        onMouseDown={handleMouseDown}
                        onMouseEnter={handleMouseEnterSelection}
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
    {contextMenu && createPortal(
      <motion.div
        className="msg-context-menu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        style={{ top: contextMenu.y, left: contextMenu.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="msg-context-menu-item msg-context-menu-forward"
          onClick={() => handleForward(contextMenu.messageId)}
        >
          <Repeat size={14} className="msg-context-menu-icon" />
          Переслать
        </button>
        {contextMenu.isOwn ? (
          <>
            <button
              className="msg-context-menu-item msg-context-menu-delete"
              onClick={() => handleDeleteOptions(contextMenu.messageId)}
            >
              <Trash2 size={14} className="msg-context-menu-icon" />
              Удалить
            </button>
          </>
        ) : (
          <button
            className="msg-context-menu-item msg-context-menu-delete-local"
            onClick={() => handleDeleteOptions(contextMenu.messageId)}
          >
            <Trash2 size={14} className="msg-context-menu-icon" />
            Удалить у себя
          </button>
        )}
      </motion.div>,
      document.body
    )}

    {/* Меню выбора удаления — портал в body */}
    {deleteMenu && createPortal(
      <motion.div
        className="msg-context-menu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        style={{ top: deleteMenu.y, left: deleteMenu.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="msg-context-menu-item msg-context-menu-delete-everyone"
          onClick={() => handleDeleteEveryone(deleteMenu.messageId)}
        >
          <Trash2 size={14} className="msg-context-menu-icon" />
          Удалить у всех
        </button>
        <button
          className="msg-context-menu-item msg-context-menu-delete-local"
          onClick={() => handleDeleteLocal(deleteMenu.messageId)}
        >
          <Trash2 size={14} className="msg-context-menu-icon" />
          Удалить у себя
        </button>
      </motion.div>,
      document.body
    )}

    {/* Модалка пересылки */}
    <ForwardModal
      isOpen={forwardModalOpen}
      onClose={() => setForwardModalOpen(false)}
      message={forwardMessage}
      currentChatId={chatId}
      onChatOpen={(cid, user) => {
        if (onSwitchChat) onSwitchChat(cid, user);
      }}
    />

    {/* Панель действий для выбранных сообщений */}
    <SelectionActionsBar
      isVisible={isSelectionMode}
      selectedCount={selectionStats.total}
      ownCount={selectionStats.own}
      othersCount={selectionStats.others}
      onClose={exitSelectionMode}
      onDeleteLocal={handleSelectionDeleteLocal}
      onDeleteEveryone={handleSelectionDeleteEveryone}
      onForward={handleSelectionForward}
      onCopyText={handleSelectionCopyText}
      canDeleteEveryone={selectionStats.own > 0}
    />
    </>
  );
};

export default ChatWindow;
