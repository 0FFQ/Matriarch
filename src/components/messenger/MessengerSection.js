import React from 'react';
import MessengerButton from './MessengerButton';
import ShareToChatModal from './ShareToChatModal';

/**
 * Компонент секции мессенджера
 * @param {boolean} firebaseUser - объект пользователя Firebase
 * @param {Object} messenger - объект мессенджера
 * @param {Object} controls - объект обработчиков
 * @param {Object} t - объект с переводами
 */
const MessengerSection = ({ firebaseUser, messenger, controls, t }) => {
  if (!firebaseUser) return null;

  return (
    <>
      {/* Кнопка мессенджера */}
      <MessengerButton
        onClick={controls.handleOpenMessenger}
        unreadCount={messenger.unreadChats + messenger.unreadNotifications}
      />

      {/* Модалка шаринга в чат */}
      <ShareToChatModal
        t={t}
        isOpen={messenger.shareToChatOpen}
        onClose={controls.handleCloseShareModal}
        contentItem={messenger.shareToChatContent}
        onChatOpen={controls.handleOpenChatFromShare}
      />
    </>
  );
};

export default MessengerSection;
