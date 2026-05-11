import { useCallback } from 'react';


const useSocialIntegration = (messenger, search) => {
  
  const handleShareInChat = useCallback((item) => {
    messenger.setShareToChatContent(item);
    messenger.setShareToChatOpen(true);
  }, [messenger]);

  
  const handleSelectSharedContent = useCallback((content) => {
    
    messenger.setChatOpen(false);
    messenger.setActiveChatId(null);
    messenger.setActiveChatUser(null);
    messenger.setChatListOpen(true);

    
    const title = content.title || '';
    if (title) {
      search.setQuery(title);
      search.searchByText(title);
    }
  }, [messenger, search]);

  
  const handleOpenMessenger = useCallback(() => {
    messenger.setChatListOpen(true);
    messenger.setChatOpen(false);
  }, [messenger]);

  
  const handleCloseShareModal = useCallback(() => {
    messenger.setShareToChatOpen(false);
    messenger.setShareToChatContent(null);
  }, [messenger]);

  
  const handleOpenChatFromShare = useCallback((chatId, user) => {
    messenger.setActiveChatId(chatId);
    messenger.setActiveChatUser(user);
    messenger.setChatOpen(true);
    messenger.setChatListOpen(false);
  }, [messenger]);

  return {
    handleShareInChat,
    handleSelectSharedContent,
    handleOpenMessenger,
    handleCloseShareModal,
    handleOpenChatFromShare
  };
};

export default useSocialIntegration;
