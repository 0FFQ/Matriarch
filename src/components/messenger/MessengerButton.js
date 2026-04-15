import React from 'react';
import { MessageCircle } from 'lucide-react';

const MessengerButton = ({ onClick, unreadCount }) => {
  return (
    <button
      className="messenger-fab"
      onClick={onClick}
    >
      <MessageCircle size={20} />
      {unreadCount > 0 && (
        <span
          className="messenger-fab-badge"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default MessengerButton;
