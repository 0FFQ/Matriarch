import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Search, User } from 'lucide-react';
import { getAllUsers } from '../firebase/messages';
import { useUser } from '../context/UserContext';

const ShareModal = ({ t, isOpen, onClose, contentItem, onShare }) => {
  const { firebaseUser, profile } = useUser();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setMessage('');
      setSelectedUsers([]);
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      // Исключаем текущего пользователя
      const filtered = allUsers.filter(u => u.id !== firebaseUser?.uid);
      setUsers(filtered);
      setFilteredUsers(filtered);
    } catch (error) {
      console.error('[ShareModal] Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация пользователей
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

  const toggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0 || !contentItem) return;

    setSending(true);
    try {
      // Отправляем каждому выбранному пользователю
      for (const userId of selectedUsers) {
        if (onShare) {
          await onShare(userId, contentItem, message);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('[ShareModal] Share error:', error);
    } finally {
      setSending(false);
    }
  };

  const contentTitle = contentItem?.title || contentItem?.name || '';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t === 'ru' ? 'Поделиться' : 'Share'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            {contentTitle && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {t === 'ru' ? 'Контент:' : 'Content:'} {contentTitle}
              </p>
            )}
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t === 'ru' ? 'Поиск пользователей...' : 'Search users...'}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-500"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {t === 'ru' ? 'Загрузка...' : 'Loading...'}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {t === 'ru' ? 'Пользователи не найдены' : 'No users found'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      className="w-5 h-5 text-gray-500 rounded focus:ring-2 focus:ring-gray-500"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name || (t === 'ru' ? 'Аноним' : 'Anonymous')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t === 'ru' ? 'Добавить сообщение (необязательно)...' : 'Add a message (optional)...'}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-500 resize-none"
              rows="3"
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mr-2"
              disabled={sending}
            >
              {t === 'ru' ? 'Отмена' : 'Cancel'}
            </button>
            <button
              onClick={handleShare}
              disabled={selectedUsers.length === 0 || sending}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending 
                ? (t === 'ru' ? 'Отправка...' : 'Sending...') 
                : (t === 'ru' ? 'Отправить' : 'Send')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
