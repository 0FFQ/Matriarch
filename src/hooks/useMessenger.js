import { useState } from 'react';

/**
 * Кастомный хук для управления состоянием мессенджера
 * @returns {Object} состояние и функции для управления мессенджером
 */
const useMessenger = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatListOpen, setChatListOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [usersOpen, setUsersOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [viewingUserProfile, setViewingUserProfile] = useState(false);
  const [sharedContentOpen, setSharedContentOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareContentItem, setShareContentItem] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Шаринг контента в чат
  const [shareToChatOpen, setShareToChatOpen] = useState(false);
  const [shareToChatContent, setShareToChatContent] = useState(null);

  return {
    chatOpen,
    setChatOpen,
    chatListOpen,
    setChatListOpen,
    activeChatId,
    setActiveChatId,
    activeChatUser,
    setActiveChatUser,
    usersOpen,
    setUsersOpen,
    viewingUserId,
    setViewingUserId,
    viewingUserProfile,
    setViewingUserProfile,
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
    shareToChatOpen,
    setShareToChatOpen,
    shareToChatContent,
    setShareToChatContent
  };
};

export default useMessenger;
