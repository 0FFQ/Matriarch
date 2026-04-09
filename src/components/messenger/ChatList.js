import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { X, Plus, MessageSquare, ArrowLeft, Search, Check, CheckCheck } from 'lucide-react';
import { subscribeToUserChats, getAllUsers, initializeChat } from '../../firebase/messages';
import { useUser } from '../../context/UserContext';

const ChatList = ({ onSelectChat, onBack, t, isOpen, onClose }) => {
  const { firebaseUser, profile } = useUser();
  const [chats, setChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPickerQuery, setSearchPickerQuery] = useState('');
  const usersRefreshRef = useRef(null);

  const dragControls = useDragControls();
  const panelRef = useRef(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const panelHeight = panelRef.current.offsetHeight;
      setConstraints({
        left: -(window.innerWidth - 420),
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
        if (showUserPicker) {
          setShowUserPicker(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, showUserPicker, onClose]);

  // Подписка на чаты пользователя
  useEffect(() => {
    if (!firebaseUser || !isOpen) return;

    let unsubscribe = null;
    let isSubscribed = true;

    const setupSubscription = async () => {
      try {
        unsubscribe = subscribeToUserChats(firebaseUser.uid, (chatsData) => {
          if (isSubscribed) {
            setChats(chatsData);
          }
        });
      } catch (error) {
        console.error('[ChatList] Subscription setup error:', error);
      }
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        try { unsubscribe(); } catch (error) {}
        unsubscribe = null;
      }
      setChats([]);
    };
  }, [firebaseUser, isOpen]);

  // Загрузка всех пользователей
  useEffect(() => {
    if (!firebaseUser || !isOpen) return;

    const loadUsers = async () => {
      try {
        const users = await getAllUsers();
        setAllUsers(users.filter(u => u.id !== firebaseUser?.uid));
      } catch (error) {
        console.error('[ChatList] Load users error:', error);
      }
    };
    loadUsers();

    // Обновляем список каждые 30 секунд для актуального lastSeen
    usersRefreshRef.current = setInterval(loadUsers, 30 * 1000);

    return () => {
      if (usersRefreshRef.current) {
        clearInterval(usersRefreshRef.current);
      }
    };
  }, [firebaseUser, isOpen]);

  // Начать новый чат
  const startNewChat = useCallback(async (targetUser) => {
    if (!firebaseUser || !profile) return;

    const chatId = await initializeChat(
      firebaseUser.uid,
      targetUser.id,
      profile,
      targetUser
    );

    setShowUserPicker(false);
    setSearchPickerQuery('');
    onSelectChat(chatId, targetUser);
  }, [firebaseUser, profile, onSelectChat]);

  // Фильтрация пользователей по поиску
  const filteredUsers = allUsers.filter(user =>
    user.name?.toLowerCase().includes(searchPickerQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchPickerQuery.toLowerCase())
  );

  // Получить собеседника из чата
  const getOtherParticipant = (chat) => {
    if (!chat.participantProfiles || !firebaseUser) return null;
    const otherId = chat.participants.find(id => id !== firebaseUser.uid);
    const profile = chat.participantProfiles[otherId];
    if (!profile) return null;
    return { id: otherId, ...profile };
  };

  // Форматирование времени
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'сейчас' : `${minutes}м`;
    } else if (hours < 24) {
      return `${hours}ч`;
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  // Проверка онлайн-статуса по lastSeen
  const isUserOnline = (user) => {
    if (!user?.lastSeen) return false;
    const lastSeen = new Date(user.lastSeen).getTime();
    return Date.now() - lastSeen < 30 * 1000; // 30 секунд
  };

  if (!isOpen) return null;

  return (
    <>
    <motion.div
      ref={panelRef}
      className="messenger-panel"
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
          {/* Заголовок */}
          <div
            className="messenger-header"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: 'grab' }}
          >
            <div className="messenger-title">
              <MessageSquare size={20} />
              <h2>{t.messenger || 'Мессенджер'}</h2>
            </div>
            <div className="messenger-buttons">
              <button
                className="messenger-new-chat-btn"
                onClick={() => setShowUserPicker(true)}
                title={t.newChat || 'Новый чат'}
              >
                <Plus size={20} />
              </button>
              {onBack ? (
                <button className="messenger-back-btn" onClick={onBack}>
                  <ArrowLeft size={20} />
                </button>
              ) : (
                <button className="messenger-close-btn" onClick={onClose}>
                  <X size={24} />
                </button>
              )}
            </div>
          </div>

          {/* Поиск по чатам */}
          <div className="messenger-search">
            <Search size={16} />
            <input
              type="text"
              placeholder={t.searchUser || 'Поиск...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Список чатов */}
          <div className="messenger-chat-list">
            {chats.length === 0 ? (
              <motion.div
                className="messenger-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="messenger-empty-icon">
                  <MessageSquare size={48} />
                </div>
                <p>{t.noChats || 'Нет чатов'}</p>
                <button onClick={() => setShowUserPicker(true)}>
                  {t.startNewChat || 'Начать новый чат'}
                </button>
              </motion.div>
            ) : (
              chats.map((chat, index) => {
                const otherUser = getOtherParticipant(chat);
                if (!otherUser) return null;

                const matchesSearch = searchQuery === '' ||
                  otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  otherUser.email?.toLowerCase().includes(searchQuery.toLowerCase());

                if (!matchesSearch) return null;

                const chatKey = chat.id ? `chat-${chat.id}` : `chat-idx-${index}`;
                const lastMsgText = chat.lastMessage || (t.startConversation || 'Начните общение...');
                const isOwnLast = chat.lastSenderId === firebaseUser?.uid;
                const isRead = !!chat.lastMessageReadBy?.[otherUser.id];

                return (
                  <motion.div
                    key={chatKey}
                    className="messenger-chat-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={() => onSelectChat(chat.id, otherUser)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="chat-avatar">
                      {otherUser.avatar ? (
                        <img src={otherUser.avatar} alt={otherUser.name} />
                      ) : (
                        <div className="chat-avatar-placeholder">
                          {(otherUser.name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      {isUserOnline(otherUser) && (
                        <span className="chat-avatar-online-indicator" />
                      )}
                    </div>
                    <div className="chat-info">
                      <div className="chat-name">{otherUser.name || otherUser.email}</div>
                      <div className="chat-last-message-row">
                        <div className="chat-last-message">
                          {lastMsgText}
                        </div>
                        {/* Статус прочтения последнего сообщения */}
                        {isOwnLast && (
                          <span className={`chat-read-status ${isRead ? 'read' : 'sent'}`}>
                            {isRead ? (
                              <CheckCheck size={14} />
                            ) : (
                              <Check size={14} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="chat-meta">
                      <span className="chat-time">
                        {formatTime(chat.lastMessageTime || chat.updatedAt)}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

      {/* Выбор пользователя для нового чата */}
      {showUserPicker && (
        <motion.div
          className="user-picker-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { setShowUserPicker(false); setSearchPickerQuery(''); }}
        >
            <motion.div
              className="user-picker"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="user-picker-header">
                <h3>{t.selectUser || 'Выберите собеседника'}</h3>
                <button onClick={() => { setShowUserPicker(false); setSearchPickerQuery(''); }}>
                  <X size={20} />
                </button>
              </div>

              <div className="user-picker-search-wrapper">
                <Search size={16} />
                <input
                  type="text"
                  className="user-picker-search"
                  placeholder={t.searchUser || 'Поиск по имени или email...'}
                  value={searchPickerQuery}
                  onChange={(e) => setSearchPickerQuery(e.target.value)}
                />
              </div>

              <div className="user-picker-list">
                {filteredUsers.length === 0 ? (
                  <div className="user-picker-empty">
                    {t.noUsersFound || 'Пользователи не найдены'}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="user-picker-item"
                      onClick={() => startNewChat(user)}
                    >
                      <div className="user-picker-avatar">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} />
                        ) : (
                          <div className="user-picker-avatar-placeholder">
                            {(user.name || '?')[0].toUpperCase()}
                          </div>
                        )}
                        {isUserOnline(user) && (
                          <span className="chat-avatar-online-indicator" />
                        )}
                      </div>
                      <div className="user-picker-info">
                        <div className="user-picker-name">{user.name}</div>
                        <div className="user-picker-email">{user.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
    </>
  );
};

export default ChatList;
