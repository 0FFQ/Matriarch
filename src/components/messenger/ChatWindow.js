import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { ArrowLeft, Send, MessageSquare, X, SendHorizonal, Trash2, Repeat, MousePointerClick, Users } from 'lucide-react';
import { subscribeToMessages, sendMessage, markMessagesAsRead, deleteMessage, deleteMessageEveryone } from '../../firebase/messages';
import { subscribeToUserPresence } from '../../firebase/firestore';
import { useUser } from '../../context/UserContext';
import MessageBubble from './MessageBubble';
import { createPortal } from 'react-dom';
import ForwardModal from './ForwardModal';
import SelectionActionsBar from './SelectionActionsBar';
import useMessageSelection from '../../hooks/useMessageSelection';
import useWindowPosition from '../../hooks/useWindowPosition';

// Компонент группы сообщений с датой
const DateGroup = React.memo(({ date, messages, isSelectionMode, formatTime, firebaseUser, onSelectContent, handleContextMenu, isSelected }) => {
  const [noSelect, setNoSelect] = React.useState(false);
  const timerRef = React.useRef(null);

  const handlePointerDown = () => {
    if (isSelectionMode) {
      setNoSelect(true);
      timerRef.current = setTimeout(() => {
        setNoSelect(false);
        timerRef.current = null;
      }, 600);
    }
  };
  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setNoSelect(false);
    }
  };

  return (
    <div className="chat-messages-group">
      <div
        className={`chat-date-divider ${noSelect ? 'no-select-cursor' : ''}`}
        onPointerDown={isSelectionMode ? handlePointerDown : undefined}
        onPointerUp={isSelectionMode ? handlePointerUp : undefined}
        onPointerLeave={isSelectionMode ? handlePointerUp : undefined}
      >
        <span>{date}</span>
      </div>
      <AnimatePresence>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === firebaseUser?.uid}
            formatTime={formatTime}
            onOpenContent={onSelectContent}
            onContextMenu={(e) => handleContextMenu(e, message.id)}
            isSelectionMode={isSelectionMode}
            isSelected={isSelected(message.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

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
  const lastTouchedRef = useRef(null);
  const chatContainerRef = useRef(null);

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
  } = useMessageSelection(messages || [], firebaseUser?.uid || '');

  // Глобальный mouseup — сброс drag
  useEffect(() => {
    const handleMouseUp = () => {
      isMouseDraggingRef.current = false;
      lastTouchedRef.current = null;
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Начало drag-выбора — mousedown на контейнере сообщений
  const handleContainerMouseDown = useCallback((e) => {
    // Если клик внутри shared content — не выбираем сообщение
    if (e.target.closest('[data-no-select]')) {
      return;
    }

    // Проверяем target — если клик на shared content или его дочерних элементах, не выбираем
    let el = e.target;
    const chatEl = chatContainerRef.current;
    while (el && el !== chatEl) {
      if (
        el.classList?.contains('shared-content-bubble') ||
        el.classList?.contains('shared-content-info') ||
        el.classList?.contains('shared-content-header') ||
        el.classList?.contains('shared-content-meta') ||
        el.classList?.contains('shared-content-title') ||
        el.classList?.contains('shared-content-type') ||
        el.classList?.contains('shared-content-year') ||
        el.classList?.contains('shared-content-rating') ||
        el.classList?.contains('shared-content-overview') ||
        el.classList?.contains('shared-content-poster')
      ) {
        return;
      }
      el = el.parentElement;
    }

    const elements = document.elementsFromPoint(e.clientX, e.clientY);

    // Если клик на тексте, времени или пересланном — не начинаем drag-выбор
    const textEl = elements.find(
      (el) => el.classList?.contains('message-text') || el.classList?.contains('message-time') || el.classList?.contains('message-forwarded-header')
    );
    if (textEl) {
      e.stopPropagation();
      return;
    }

    const bubbleEl = elements.find(
      (el) => el.classList?.contains('message-bubble')
    );

    if (bubbleEl) {
      const messageId = bubbleEl.getAttribute('data-message-id');
      if (messageId) {
        isMouseDraggingRef.current = true;
        lastTouchedRef.current = messageId;
        if (!isSelectionMode) {
          enterSelectionMode();
        }
        if (isSelected(messageId)) {
          deselectMessage(messageId);
        } else {
          selectMessage(messageId);
        }
      }
    }
  }, [isSelectionMode, isSelected, selectMessage, deselectMessage, enterSelectionMode]);

  // Продолжение drag-выбора — mousemove
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isMouseDraggingRef.current || !chatContainerRef.current) return;

      const rect = chatContainerRef.current.getBoundingClientRect();
      if (
        e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top || e.clientY > rect.bottom
      ) return;

      const elements = document.elementsFromPoint(e.clientX, e.clientY);

      // Не выбираем если курсор над текстом, временем или пересланным
      const textEl = elements.find(
        (el) => el.classList?.contains('message-text') || el.classList?.contains('message-time') || el.classList?.contains('message-forwarded-header')
      );
      if (textEl) return;

      const bubbleEl = elements.find(
        (el) => el.classList?.contains('message-bubble')
      );

      if (bubbleEl) {
        const messageId = bubbleEl.getAttribute('data-message-id');
        if (messageId && messageId !== lastTouchedRef.current) {
          lastTouchedRef.current = messageId;
          if (isSelected(messageId)) {
            deselectMessage(messageId);
          } else {
            selectMessage(messageId);
          }
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isSelected, selectMessage, deselectMessage]);

  const dragControls = useDragControls();
  const panelRef = useRef(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  // Сохранение позиции окна
  const { x, y, handleDragEnd } = useWindowPosition(
    `chat-window-${chatId || 'default'}`,
    isOpen
  );

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const headerEl = panelRef.current.querySelector('.chat-window-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 70;
      const panelHeight = panelRef.current.offsetHeight;
      const initialTop = 16;
      const maxTranslateY = window.innerHeight - initialTop - headerHeight;
      setConstraints({
        left: -(window.innerWidth - 500),
        right: 0,
        top: 0,
        bottom: Math.max(0, maxTranslateY)
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
      setDeleteMenu({ x: contextMenu.x, y: contextMenu.y, messageId });
      setContextMenu(null);
    }
  }, [contextMenu]);

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
    const othersIds = selectedMessages.filter(m => m.senderId !== firebaseUser?.uid).map(m => m.id);
    setLocalDeleted(prev => new Set([...prev, ...othersIds]));
    exitSelectionMode();
  }, [selectedMessages, firebaseUser, exitSelectionMode]);

  const handleSelectionDeleteEveryone = useCallback(async () => {
    if (selectedMessages.length === 0) return;

    for (const msg of selectedMessages) {
      try {
        if (msg.senderId === firebaseUser?.uid) {
          // Свои — через обычную функцию
          await deleteMessage(msg.id, msg.senderId, firebaseUser.uid);
        } else {
          // Чужие — через функцию без проверки
          await deleteMessageEveryone(msg.id);
        }
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
          ref={(el) => {
            panelRef.current = el;
            chatContainerRef.current = el;
          }}
          className="chat-window"
          drag
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={constraints}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ x, y }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
              {/* Кнопка выбора собеседника */}
              <button
                className="chat-select-btn"
                onClick={() => onSwitchChat && onSwitchChat()}
                title="Выбрать собеседника"
              >
                <Users size={20} />
              </button>
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

          {/* Панель действий для выбранных сообщений */}
          <SelectionActionsBar
            isVisible={isSelectionMode}
            selectedCount={selectionStats.total}
            onClose={exitSelectionMode}
            onDeleteEveryone={handleSelectionDeleteEveryone}
            onForward={handleSelectionForward}
          />

          {/* Сообщения */}
          <div className="chat-messages" ref={chatContainerRef} onMouseDown={handleContainerMouseDown}>
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
                <DateGroup key={date} date={date} messages={dateMessages} isSelectionMode={isSelectionMode} formatTime={formatMessageTime} firebaseUser={firebaseUser} onSelectContent={onSelectContent} handleContextMenu={handleContextMenu} isSelected={isSelected} />
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
        <button
          className="msg-context-menu-item msg-context-menu-delete"
          onClick={() => handleDeleteOptions(contextMenu.messageId)}
        >
          <Trash2 size={14} className="msg-context-menu-icon" />
          Удалить
        </button>
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
    </>
  );
};

export default ChatWindow;
