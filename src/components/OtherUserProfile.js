import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Eye, Bookmark, Film, Tv, Share2, MessageSquare } from 'lucide-react';
import { getUserProfile } from '../firebase/social';
import { initializeChat } from '../firebase/messages';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

const OtherUserProfile = ({ t, isOpen, onClose, userId, onShareContent, onOpenChat }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist', 'favorites', 'watched'

  useEffect(() => {
    if (isOpen && userId) {
      loadUserProfile();
    }
  }, [isOpen, userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await getUserProfile(userId);
      
      if (profile) {
        setUserProfile(profile);
      } else {
        setError('Профиль не найден');
      }
    } catch (err) {
      console.error('[OtherUserProfile] Error loading profile:', err);
      setError('Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!userProfile) return;
    
    try {
      const chatId = await initializeChat(userId, userProfile.name, userProfile);
      if (onOpenChat) {
        onOpenChat(chatId, userProfile);
      }
      onClose();
    } catch (err) {
      console.error('[OtherUserProfile] Error starting chat:', err);
    }
  };

  const handleShareContent = (contentItem) => {
    if (onShareContent && userProfile) {
      onShareContent(userId, contentItem);
    }
  };

  const getContentList = () => {
    if (!userProfile) return [];
    
    switch (activeTab) {
      case 'watchlist':
        return userProfile.watchlist || [];
      case 'favorites':
        return userProfile.favorites || [];
      case 'watched':
        return userProfile.watched || [];
      default:
        return [];
    }
  };

  const getTabLabel = (tab) => {
    const labels = {
      watchlist: t === 'ru' ? 'Буду смотреть' : 'Watchlist',
      favorites: t === 'ru' ? 'Избранное' : 'Favorites',
      watched: t === 'ru' ? 'Просмотренное' : 'Watched'
    };
    return labels[tab];
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'watchlist':
        return <Bookmark className="w-4 h-4" />;
      case 'favorites':
        return <Heart className="w-4 h-4" />;
      case 'watched':
        return <Eye className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getContentType = (item) => {
    return item.media_type || (item.first_air_date ? 'tv' : 'movie');
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
          {loading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              {t === 'ru' ? 'Загрузка профиля...' : 'Loading profile...'}
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">
              {error}
            </div>
          ) : userProfile ? (
            <>
              {/* Header */}
              <div className="relative p-6 bg-gradient-to-r from-gray-500 to-gray-600">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                
                <div className="flex items-center gap-4">
                  {userProfile.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white/30"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {userProfile.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">
                      {userProfile.name || (t === 'ru' ? 'Аноним' : 'Anonymous')}
                    </h2>
                    <p className="text-white/80 text-sm">
                      {userProfile.email}
                    </p>
                  </div>

                  <button
                    onClick={handleStartChat}
                    className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t === 'ru' ? 'Написать' : 'Message'}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 p-4">
                  {['watchlist', 'favorites', 'watched'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        activeTab === tab
                          ? 'bg-gray-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {getTabIcon(tab)}
                      {getTabLabel(tab)}
                      {userProfile[tab] && userProfile[tab].length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                          {userProfile[tab].length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content List */}
              <div className="overflow-y-auto max-h-[calc(85vh-280px)] p-6">
                {getContentList().length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {t === 'ru' ? 'Список пуст' : 'List is empty'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {getContentList().map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <div className="relative">
                          {item.poster_path ? (
                            <img
                              src={`${IMAGE_BASE}${item.poster_path}`}
                              alt={item.title || item.name}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              {getContentType(item) === 'movie' ? (
                                <Film className="w-12 h-12 text-gray-400" />
                              ) : (
                                <Tv className="w-12 h-12 text-gray-400" />
                              )}
                            </div>
                          )}
                          
                          {/* Share Button Overlay */}
                          <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleShareContent(item)}
                              className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white transition-colors"
                              title={t === 'ru' ? 'Поделиться' : 'Share'}
                            >
                              <Share2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.title || item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              {item.vote_average?.toFixed(1) || 'N/A'}
                            </span>
                            <span>
                              {item.release_date || item.first_air_date || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OtherUserProfile;
