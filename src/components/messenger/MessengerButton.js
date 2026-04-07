import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const MessengerButton = ({ onClick, unreadCount }) => {
  return (
    <motion.button
      className="messenger-fab"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={onClick}
    >
      <MessageCircle size={20} />
      {unreadCount > 0 && (
        <motion.span
          className="messenger-fab-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.span>
      )}
    </motion.button>
  );
};

export default MessengerButton;
