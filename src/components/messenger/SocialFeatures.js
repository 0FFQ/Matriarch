import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { subscribeToUserChats } from '../../firebase/messages';
import { getUnreadNotificationsCount, subscribeToNotifications, shareContent, getUserProfile } from '../../firebase/social';
import UsersList from './UsersList';
import OtherUserProfile from '../user/OtherUserProfile';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import SharedContentPanel from './SharedContentPanel';
import ShareModal from './ShareModal';
import NotificationsPanel from './NotificationsPanel';

const SocialFeatures = ({ 
  t,
  
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
  setUnreadNotifications,
  onSelectSharedContent
}) => {
  const { firebaseUser, profile } = useUser();

  
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = subscribeToUserChats(firebaseUser.uid, (chats) => {
      
      
      let unread = 0;
      chats.forEach(chat => {
        
        if (chat.lastSenderId !== firebaseUser.uid) {
          
          const hasRead = chat.lastMessageReadBy?.[firebaseUser.uid] === true;
          
          const isActive = chat.id === activeChatId;
          if (!hasRead && !isActive) {
            unread++;
          }
        }
      });
      setUnreadChats(unread);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseUser, activeChatId]);

  
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

  
  const handleViewProfile = (userId) => {
    setViewingUserId(userId);
    setViewingUserProfile(true);
    setUsersOpen(false);
  };

  
  const handleOpenChatFromUsers = (chatId, user) => {
    setActiveChatId(chatId);
    setActiveChatUser(user);
    setChatOpen(true);
    setUsersOpen(false);
  };

  
  const handleSelectChat = (chatId, user) => {
    setActiveChatId(chatId);
    setActiveChatUser(user);
    setChatOpen(true);
    setChatListOpen(false);
  };

  
  const handleSelectNotification = (notification) => {
    if (notification.type === 'content_shared' && notification.sharedContentId) {
      setSharedContentOpen(true);
    }
    setNotificationsOpen(false);
  };

  return (
    <>
      {}
      <UsersList
        t={t}
        isOpen={usersOpen}
        onClose={() => setUsersOpen(false)}
        onViewProfile={handleViewProfile}
        onOpenChat={handleOpenChatFromUsers}
      />

      {}
      <OtherUserProfile
        t={t}
        isOpen={viewingUserProfile}
        onClose={() => setViewingUserProfile(false)}
        userId={viewingUserId}
        onShareContent={handleShareContent}
        onOpenChat={handleOpenChatFromUsers}
      />

      {}
      <ChatList
        t={t}
        isOpen={chatListOpen}
        onClose={() => setChatListOpen(false)}
        onSelectChat={handleSelectChat}
      />

      {}
      <ChatWindow
        t={t}
        chatId={activeChatId}
        otherUser={activeChatUser}
        isOpen={chatOpen}
        onSwitchChat={(cid, user) => {
          setActiveChatId(cid);
          setActiveChatUser(user);
        }}
        onClose={() => {
          setChatOpen(false);
          setActiveChatId(null);
          setActiveChatUser(null);
          setChatListOpen(true);
        }}
        onBack={() => {
          setChatOpen(false);
          setActiveChatId(null);
          setActiveChatUser(null);
          setChatListOpen(true);
        }}
        onSelectContent={onSelectSharedContent}
      />

      {}
      <SharedContentPanel
        t={t}
        isOpen={sharedContentOpen}
        onClose={() => setSharedContentOpen(false)}
      />

      {}
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

      {}
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
