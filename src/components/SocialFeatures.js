import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { subscribeToUserChats } from '../firebase/messages';
import { getUnreadNotificationsCount, subscribeToNotifications, shareContent, getUserProfile } from '../firebase/social';
import UsersList from './UsersList';
import OtherUserProfile from './OtherUserProfile';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import SharedContentPanel from './SharedContentPanel';
import ShareModal from './ShareModal';
import NotificationsPanel from './NotificationsPanel';

const SocialFeatures = ({ 
  t,
  // Состояния из App.js
  usersOpen,
  setUsersOpen,
  viewingUserId,
  setViewingUserId,
  viewingUserProfile,
  setViewingUserProfile,
  chatOpen,
  setChatOpen,
  chatListOpen,
  setChatListOpen,
  activeChatId,
  setActiveChatId,
  activeChatUser,
  setActiveChatUser,
  sharedContentOpen,
  setSharedContentOpen,
  shareModalOpen,
  setShareModalOpen,
  shareContentItem,
  setShareContentItem,
  notificationsOpen,
  setNotificationsOpen,
  unreadChats,
  setUnreadChats,
  unreadNotifications,
  setUnreadNotifications
}) => {
  const { firebaseUser, profile } = useUser();

  // Подписка на чаты для подсчёта непрочитанных
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = subscribeToUserChats(firebaseUser.uid, (chats) => {
      // Подсчитываем непрочитанные сообщения
      let unread = 0;
      chats.forEach(chat => {
        if (chat.lastSenderId !== firebaseUser.uid) {
          unread++;
        }
      });
      setUnreadChats(unread);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseUser]);

  // Подписка на уведомления
  useEffect(() => {
    if (!firebaseUser) return;

    const loadUnreadCount = async () => {
      const count = await getUnreadNotificationsCount(firebaseUser.uid);
      setUnreadNotifications(count);
    };

    loadUnreadCount();

    const unsubscribe = subscribeToNotifications(firebaseUser.uid, (notifications) => {
      const unread = notifications.filter(n => !n.read).length;
      setUnreadNotifications(unread);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseUser]);

  // Обработчик шаринга контента
  const handleShareContent = (userId, contentItem) => {
    setShareContentItem(contentItem);
    setShareModalOpen(true);
  };

  const handleShare = async (targetUserId, contentItem, message) => {
    if (!firebaseUser) return;
    
    try {
      await shareContent(firebaseUser.uid, targetUserId, contentItem, message);
    } catch (error) {
      console.error('[SocialFeatures] Share error:', error);
    }
  };

  // Обработчик открытия профиля другого пользователя
  const handleViewProfile = (userId) => {
    setViewingUserId(userId);
    setViewingUserProfile(true);
    setUsersOpen(false);
  };

  // Обработчик открытия чата из списка пользователей
  const handleOpenChatFromUsers = (chatId, user) => {
    setActiveChatId(chatId);
    setActiveChatUser(user);
    setChatOpen(true);
    setUsersOpen(false);
  };

  // Обработчик выбора чата из ChatList
  const handleSelectChat = (chatId, user) => {
    setActiveChatId(chatId);
    setActiveChatUser(user);
    setChatOpen(true);
    setChatListOpen(false);
  };

  // Обработчик выбора уведомления
  const handleSelectNotification = (notification) => {
    if (notification.type === 'content_shared' && notification.sharedContentId) {
      setSharedContentOpen(true);
    }
    setNotificationsOpen(false);
  };

  return (
    <>
      {/* Панель пользователей */}
      <UsersList
        t={t}
        isOpen={usersOpen}
        onClose={() => setUsersOpen(false)}
        onViewProfile={handleViewProfile}
        onOpenChat={handleOpenChatFromUsers}
      />

      {/* Профиль другого пользователя */}
      <OtherUserProfile
        t={t}
        isOpen={viewingUserProfile}
        onClose={() => setViewingUserProfile(false)}
        userId={viewingUserId}
        onShareContent={handleShareContent}
        onOpenChat={handleOpenChatFromUsers}
      />

      {/* Список чатов */}
      <ChatList
        t={t}
        isOpen={chatListOpen}
        onClose={() => setChatListOpen(false)}
        onSelectChat={handleSelectChat}
      />

      {/* Окно чата */}
      {chatOpen && activeChatId && (
        <ChatWindow
          t={t}
          chatId={activeChatId}
          otherUser={activeChatUser}
          onBack={() => {
            setChatOpen(false);
            setActiveChatId(null);
            setActiveChatUser(null);
            setChatListOpen(true);
          }}
        />
      )}

      {/* Панель общего контента */}
      <SharedContentPanel
        t={t}
        isOpen={sharedContentOpen}
        onClose={() => setSharedContentOpen(false)}
      />

      {/* Модальное окно шаринга */}
      <ShareModal
        t={t}
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setShareContentItem(null);
        }}
        contentItem={shareContentItem}
        onShare={handleShare}
      />

      {/* Панель уведомлений */}
      <NotificationsPanel
        t={t}
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onSelectNotification={handleSelectNotification}
      />
    </>
  );
};

export default SocialFeatures;
