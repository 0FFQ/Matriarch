import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = ({ users = [] }) => {
  if (users.length === 0) return null;

  const getText = () => {
    if (users.length === 1) {
      return `${users[0]} печатает...`;
    } else if (users.length === 2) {
      return `${users[0]} и ${users[1]} печатают...`;
    } else {
      return `Несколько пользователей печатают...`;
    }
  };

  return (
    <motion.div
      className="typing-indicator"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="typing-dots">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="typing-dot"
            animate={{
              y: [0, -8, 0]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      <span className="typing-text">{getText()}</span>
    </motion.div>
  );
};

export default TypingIndicator;
