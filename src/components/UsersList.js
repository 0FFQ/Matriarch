import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, MessageSquare, X, Eye, Heart, Bookmark } from 'lucide-react';
import { getAllUsers, initializeChat } from '../firebase/messages';
import { getUserProfile } from '../firebase/social';
import { useUser } from '../context/UserContext';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

const UsersList = ({ t, isOpen, onClose, onViewProfile, onOpenChat }) => {
  const { firebaseUser, profile } = useUser();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      // Инициализируем чат с правильными аргументами
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t === 'ru' ? 'Пользователи' : 'Users'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t === 'ru' ? 'Поиск пользователей...' : 'Search users...'}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {t === 'ru' ? 'Загрузка...' : 'Loading...'}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                {error}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {t === 'ru' ? 'Пользователи не найдены' : 'No users found'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <User className="w-7 h-7 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {user.name || t === 'ru' ? 'Аноним' : 'Anonymous'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewProfile && onViewProfile(user.id)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title={t === 'ru' ? 'Профиль' : 'Profile'}
                        >
                          <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleStartChat(user)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title={t === 'ru' ? 'Чат' : 'Chat'}
                        >
                          <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UsersList;
