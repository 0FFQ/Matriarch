import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Search, User, MessageSquare, X, Eye } from 'lucide-react';
import { getAllUsers, initializeChat } from '../../firebase/messages';
import { useUser } from '../../context/UserContext';

const UsersList = ({ t, isOpen, onClose, onViewProfile, onOpenChat }) => {
  const { firebaseUser, profile } = useUser();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const dragControls = useDragControls();
  const panelRef = useRef(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const headerEl = panelRef.current.querySelector('.users-list-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 70;
      const panelHeight = panelRef.current.offsetHeight;
      const initialTop = 16;
      const maxTranslateY = window.innerHeight - initialTop - headerHeight;
      setConstraints({
        left: -(window.innerWidth - 420),
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

  // Загружаем всех пользователей
  useEffect(() => {
    if (isOpen && firebaseUser) {
      loadUsers();
    }
  }, [isOpen, firebaseUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (err) {
      console.error('[UsersList] Error loading users:', err);
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация пользователей по поиску
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleStartChat = async (user) => {
    try {
      if (!firebaseUser || !profile) return;
      const chatId = await initializeChat(firebaseUser.uid, user.id, profile, user);
      if (onOpenChat) {
        onOpenChat(chatId, user);
      }
    } catch (err) {
      console.error('[UsersList] Error starting chat:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          className="users-list-panel"
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
          {/* Header */}
          <div
            className="users-list-header"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: 'grab' }}
          >
            <div className="users-list-title">
              <User size={20} />
              <h2>{t?.users || 'Пользователи'}</h2>
            </div>
            <button className="users-list-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="users-list-search">
            <Search size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t === 'ru' ? 'Поиск пользователей...' : 'Search users...'}
            />
          </div>

          {/* Users List */}
          <div className="users-list-content">
            {loading ? (
              <div className="users-list-loading">
                <div className="loading-spinner"></div>
                <p>{t === 'ru' ? 'Загрузка...' : 'Loading...'}</p>
              </div>
            ) : error ? (
              <div className="users-list-error">
                <p>{error}</p>
                <button onClick={loadUsers}>Повторить</button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="users-list-empty">
                <User size={48} />
                <p>{t === 'ru' ? 'Пользователи не найдены' : 'No users found'}</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  className="users-list-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="users-list-item-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="users-list-item-avatar-placeholder">
                        {(user.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="users-list-item-info">
                    <div className="users-list-item-name">
                      {user.name || (t === 'ru' ? 'Аноним' : 'Anonymous')}
                    </div>
                    <div className="users-list-item-email">{user.email}</div>
                  </div>
                  <div className="users-list-item-actions">
                    <button
                      className="users-list-item-btn"
                      onClick={() => onViewProfile && onViewProfile(user.id)}
                      title={t === 'ru' ? 'Профиль' : 'Profile'}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="users-list-item-btn users-list-item-btn-primary"
                      onClick={() => handleStartChat(user)}
                      title={t === 'ru' ? 'Чат' : 'Chat'}
                    >
                      <MessageSquare size={18} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UsersList;
