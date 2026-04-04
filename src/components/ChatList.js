import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToUserChats, getAllUsers, initializeChat } from '../firebase/messages';
import { useUser } from '../context/UserContext';

const ChatList = ({ onSelectChat, onBack, t }) => {
  const { firebaseUser, profile } = useUser();
  const [chats, setChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Подписка на чаты пользователя
  useEffect(() => {
    if (!firebaseUser) return;

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
        try {
          unsubscribe();
        } catch (error) {
          console.warn('[ChatList] Unsubscribe error:', error);
        }
        unsubscribe = null;
      }
      // Принудительно очищаем состояние
      setChats([]);
    };
  }, [firebaseUser]);

  // Загрузка всех пользователей
  useEffect(() => {
    const loadUsers = async () => {
      const users = await getAllUsers();
      // Исключаем текущего пользователя
      setAllUsers(users.filter(u => u.id !== firebaseUser?.uid));
    };
    loadUsers();
  }, [firebaseUser]);

  // Начать новый чат
  const startNewChat = useCallback(async (targetUser) => {
    if (!firebaseUser || !profile) return;

    const chatId = await initializeChat(
      firebaseUser.uid,
      targetUser.id,
      profile,
      targetUser
    );

    onSelectChat(chatId, targetUser);
  }, [firebaseUser, profile, onSelectChat]);

  // Фильтрация пользователей по поиску
  const filteredUsers = allUsers.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Получить собеседника из чата
  const getOtherParticipant = (chat) => {
    if (!chat.participantProfiles || !firebaseUser) return null;
    const otherId = chat.participants.find(id => id !== firebaseUser.uid);
    return chat.participantProfiles[otherId] || null;
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

  return (
    <motion.div
      className="messenger-panel"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* Заголовок */}
      <div className="messenger-header">
        <button className="messenger-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2>{t.messenger || 'Мессенджер'}</h2>
        <button
          className="messenger-new-chat-btn"
          onClick={() => setShowUserPicker(!showUserPicker)}
          title={t.newChat || 'Новый чат'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>

      {/* Список чатов */}
      <div className="messenger-chat-list">
        <AnimatePresence>
          {chats.length === 0 && (
            <motion.div
              className="messenger-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              <p>{t.noChats || 'Нет чатов'}</p>
              <button onClick={() => setShowUserPicker(true)}>
                {t.startNewChat || 'Начать новый чат'}
              </button>
            </motion.div>
          )}

          {chats.map((chat) => {
            const otherUser = getOtherParticipant(chat);
            if (!otherUser) return null;

            return (
              <motion.div
                key={chat.id}
                className="messenger-chat-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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
                </div>
                <div className="chat-info">
                  <div className="chat-name">{otherUser.name || otherUser.email}</div>
                  <div className="chat-last-message">
                    {chat.lastMessage || (t.startConversation || 'Начните общение...')}
                  </div>
                </div>
                <div className="chat-meta">
                  <span className="chat-time">
                    {formatTime(chat.lastMessageTime || chat.updatedAt)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Выбор пользователя для нового чата */}
      <AnimatePresence>
        {showUserPicker && (
          <motion.div
            className="user-picker-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUserPicker(false)}
          >
            <motion.div
              className="user-picker"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="user-picker-header">
                <h3>{t.selectUser || 'Выберите собеседника'}</h3>
                <button onClick={() => setShowUserPicker(false)}>✕</button>
              </div>

              <input
                type="text"
                className="user-picker-search"
                placeholder={t.searchUser || 'Поиск по имени или email...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

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
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatList;
