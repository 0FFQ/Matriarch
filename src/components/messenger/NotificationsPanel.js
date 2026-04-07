import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCheck, Trash2, Film, Tv, MessageSquare } from 'lucide-react';
import { 
  subscribeToNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationsCount
} from '../../firebase/social';
import { useUser } from '../../context/UserContext';

const NotificationsPanel = ({ t, isOpen, onClose, onSelectNotification }) => {
  const { firebaseUser } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firebaseUser) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [firebaseUser]);

  const loadNotifications = () => {
    if (!firebaseUser) return;

    const unsubscribe = subscribeToNotifications(firebaseUser.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  };

  const loadUnreadCount = async () => {
    if (!firebaseUser) return;
    const count = await getUnreadNotificationsCount(firebaseUser.uid);
    setUnreadCount(count);
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await markNotificationAsRead(notifId);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[Notifications] Mark as read error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!firebaseUser) return;
    try {
      await markAllNotificationsAsRead(firebaseUser.uid);
      setUnreadCount(0);
    } catch (error) {
      console.error('[Notifications] Mark all as read error:', error);
    }
  };

  const handleDelete = async (notifId) => {
    if (!firebaseUser) return;
    try {
      await deleteNotification(notifId, firebaseUser.uid);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[Notifications] Delete error:', error);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
    if (onSelectNotification) {
      onSelectNotification(notif);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t === 'ru' ? 'Только что' : 'Just now';
    if (minutes < 60) return `${minutes} ${t === 'ru' ? 'мин. назад' : 'min ago'}`;
    if (hours < 24) return `${hours} ${t === 'ru' ? 'час. назад' : 'hours ago'}`;
    if (days < 7) return `${days} ${t === 'ru' ? 'дн. назад' : 'days ago'}`;
    
    return date.toLocaleDateString(t === 'ru' ? 'ru-RU' : 'en-US');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'content_shared':
        return <Film className="w-5 h-5 text-gray-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-16 right-4 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-500 to-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-white" />
              <h3 className="text-lg font-bold text-white">
                {t === 'ru' ? 'Уведомления' : 'Notifications'}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Mark All as Read */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-gray-500 hover:text-gray-600 flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              {t === 'ru' ? 'Прочитать все' : 'Mark all as read'}
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {t === 'ru' ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {t === 'ru' ? 'Нет уведомлений' : 'No notifications'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-gray-100 dark:bg-gray-700/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notif.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {notif.title}
                        </h4>
                        {!notif.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-gray-500 rounded-full mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notif.description}
                      </p>
                      <span className="text-xs text-gray-400 mt-2 block">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif.id);
                      }}
                      className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationsPanel;
