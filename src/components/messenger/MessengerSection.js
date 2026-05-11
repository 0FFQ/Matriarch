import React from 'react';
import MessengerButton from './MessengerButton';
import ShareToChatModal from './ShareToChatModal';


const MessengerSection = ({ firebaseUser, messenger, controls, t }) => {
  if (!firebaseUser) return null;

  return (
    <>
      {}
      <MessengerButton
        onClick={controls.handleOpenMessenger}
        unreadCount={messenger.unreadChats + messenger.unreadNotifications}
      />

      {}
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
