import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Eye, Bookmark, Film, Tv, Check, AlertCircle, MessageSquare } from 'lucide-react';
import { subscribeToSharedContent, markSharedAsRead, deleteSharedContent, subscribeToUserSharedContent } from '../firebase/social';
import { useUser } from '../context/UserContext';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

const SharedContentPanel = ({ t, isOpen, onClose, onSelectContent }) => {
  const { firebaseUser } = useUser();
  const [sharedItems, setSharedItems] = useState([]);
  const [mySharedItems, setMySharedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && firebaseUser) {
      loadSharedContent();
    }
  }, [isOpen, firebaseUser]);

  const loadSharedContent = () => {
    if (!firebaseUser) return;

    setLoading(true);

    // Подписка на полученный контент
    const unsubscribeReceived = subscribeToSharedContent(firebaseUser.uid, (items) => {
      setSharedItems(items);
      setLoading(false);
    });

    // Подписка на отправленную пользователем контент
    const unsubscribeSent = subscribeToUserSharedContent(firebaseUser.uid, (items) => {
      setMySharedItems(items);
    });

    return () => {
      if (unsubscribeReceived) unsubscribeReceived();
      if (unsubscribeSent) unsubscribeSent();
    };
  };

  const handleMarkAsRead = async (itemId) => {
    try {
      await markSharedAsRead(itemId);
    } catch (error) {
      console.error('[SharedContentPanel] Mark as read error:', error);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await deleteSharedContent(itemId, firebaseUser.uid);
    } catch (error) {
      console.error('[SharedContentPanel] Delete error:', error);
    }
  };

  const handleViewContent = (item) => {
    if (onSelectContent) {
      onSelectContent(item);
    }
    handleMarkAsRead(item.id);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(t === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t === 'ru' ? 'Поделиться' : 'Shared'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'received'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                {t === 'ru' ? 'Полученные' : 'Received'}
                {sharedItems.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {sharedItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'sent'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                {t === 'ru' ? 'Отправленные' : 'Sent'}
                {mySharedItems.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {mySharedItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content List */}
          <div className="overflow-y-auto max-h-[calc(85vh-200px)] p-6">
            {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                {t === 'ru' ? 'Загрузка...' : 'Loading...'}
              </div>
            ) : activeTab === 'received' ? (
              sharedItems.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t === 'ru' 
                    ? 'Вам ещё не делились контентом' 
                    : 'No one has shared content with you yet'}
                </div>
              ) : (
                <div className="space-y-4">
                  {sharedItems.map((item) => (
                    <SharedContentCard
                      key={item.id}
                      item={item}
                      t={t}
                      onView={handleViewContent}
                      onDelete={handleDelete}
                      isOwner={false}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )
            ) : (
              mySharedItems.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t === 'ru' 
                    ? 'Вы ещё не делились контентом' 
                    : 'You haven\'t shared any content yet'}
                </div>
              ) : (
                <div className="space-y-4">
                  {mySharedItems.map((item) => (
                    <SharedContentCard
                      key={item.id}
                      item={item}
                      t={t}
                      onView={handleViewContent}
                      onDelete={handleDelete}
                      isOwner={true}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Карточка общего контента
const SharedContentCard = ({ item, t, onView, onDelete, isOwner, formatDate }) => {
  const content = item.content;
  const mediaType = content.media_type || 'movie';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="flex gap-4 p-4">
        {/* Poster */}
        <div className="flex-shrink-0 w-24">
          {content.poster_path ? (
            <img
              src={`${IMAGE_BASE}${content.poster_path}`}
              alt={content.title}
              className="w-full h-36 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-36 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
              {mediaType === 'movie' ? (
                <Film className="w-8 h-8 text-gray-400" />
              ) : (
                <Tv className="w-8 h-8 text-gray-400" />
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {content.title}
            </h4>
            {!item.read && !isOwner && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              {content.vote_average?.toFixed(1) || 'N/A'}
            </span>
            <span>{content.release_date?.split('-')[0] || '—'}</span>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
              {mediaType === 'movie' 
                ? (t === 'ru' ? 'Фильм' : 'Movie') 
                : (t === 'ru' ? 'Сериал' : 'TV Show')}
            </span>
          </div>

          {item.message && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 italic">
              "{item.message}"
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {formatDate(item.sharedAt)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onView(item)}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                {t === 'ru' ? 'Посмотреть' : 'View'}
              </button>
              {isOwner && (
                <button
                  onClick={() => onDelete(item.id)}
                  className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SharedContentPanel;
