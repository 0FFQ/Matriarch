import { useCallback } from 'react';

/**
 * Кастомный хук для управления социальными интеграциями
 * @param {Object} messenger - объект мессенджера
 * @param {Object} search - объект поиска
 * @returns {Object} обработчики для социальных функций
 */
const useSocialIntegration = (messenger, search) => {
  // Обработка шаринга в чат из результатов
  const handleShareInChat = useCallback((item) => {
    messenger.setShareToChatContent(item);
    messenger.setShareToChatOpen(true);
  }, [messenger]);

  // Обработка выбора контента из соц. функций
  const handleSelectSharedContent = useCallback((content) => {
    // Закрываем чат
    messenger.setChatOpen(false);
    messenger.setActiveChatId(null);
    messenger.setActiveChatUser(null);
    messenger.setChatListOpen(true);

    // Ищем фильм по названию
    const title = content.title || '';
    if (title) {
      search.setQuery(title);
      search.searchByText(title);
    }
  }, [messenger, search]);

  // Открытие мессенджера
  const handleOpenMessenger = useCallback(() => {
    messenger.setChatListOpen(true);
    messenger.setChatOpen(false);
  }, [messenger]);

  // Закрытие модалки шаринга
  const handleCloseShareModal = useCallback(() => {
    messenger.setShareToChatOpen(false);
    messenger.setShareToChatContent(null);
  }, [messenger]);

  // Открытие чата из шаринга
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
