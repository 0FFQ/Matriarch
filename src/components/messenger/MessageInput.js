import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Plus } from 'lucide-react';

const MessageInput = ({ 
  value, 
  onChange, 
  onSend, 
  placeholder, 
  disabled,
  isSending,
  onTyping 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [ripplePosition, setRipplePosition] = useState(null);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  // Автоматическая высота textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  // Обработка ввода с уведомлением о наборе
  const handleChange = (e) => {
    onChange(e);
    if (onTyping) {
      onTyping(true);
    }
  };

  // Эффект ripple при отправке
  const createRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setRipplePosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
    setTimeout(() => setRipplePosition(null), 600);
  };

  // Анимация отправки с частицами
  const handleSendWithEffects = (event) => {
    createRipple(event);
    setShowParticles(true);
    onSend(event);
    setTimeout(() => setShowParticles(false), 1000);
  };

  // Частицы при отправке
  const Particle = ({ delay }) => (
    <motion.div
      className="message-particle"
      initial={{ 
        opacity: 1, 
        scale: 0,
        x: 0,
        y: 0 
      }}
      animate={{ 
        opacity: 0, 
        scale: [0, 1, 0],
        x: (Math.random() - 0.5) * 100,
        y: -(Math.random() * 100 + 50)
      }}
      transition={{ 
        duration: 0.8, 
        delay,
        ease: 'easeOut'
      }}
      style={{
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: `hsl(${Math.random() * 60 + 200}, 70%, 60%)`
      }}
    />
  );

  return (
    <div className="message-input-container" ref={containerRef}>
      <AnimatePresence>
        {showParticles && (
          <div className="particles-container">
            {[...Array(8)].map((_, i) => (
              <Particle key={i} delay={i * 0.05} />
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        className={`message-input-wrapper ${isFocused ? 'focused' : ''}`}
        animate={{ 
          boxShadow: isFocused 
            ? '0 0 0 3px rgba(99, 102, 241, 0.1)' 
            : '0 0 0 0px rgba(99, 102, 241, 0)'
        }}
        transition={{ duration: 0.2 }}
      >
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder={placeholder || 'Введите сообщение...'}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (value.trim() && !disabled) {
                handleSendWithEffects(e);
              }
            }
          }}
          rows={1}
          maxLength={2000}
          disabled={disabled || isSending}
        />

        <div className="input-actions">
          <motion.button
            className="input-action-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Добавить"
          >
            <Plus size={18} />
          </motion.button>

          <motion.button
            className="input-action-btn"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Эмодзи"
          >
            <Smile size={18} />
          </motion.button>
        </div>
      </motion.div>

      <motion.button
        className={`send-button ${value.trim() && !disabled && !isSending ? 'active' : ''}`}
        onClick={handleSendWithEffects}
        disabled={!value.trim() || disabled || isSending}
        whileHover={{ scale: value.trim() && !disabled ? 1.05 : 1 }}
        whileTap={{ scale: value.trim() && !disabled ? 0.95 : 1 }}
        animate={{
          rotate: isSending ? 360 : 0
        }}
        transition={{
          rotate: { duration: 1, repeat: Infinity, ease: 'linear' }
        }}
      >
        {isSending ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            ⟳
          </motion.div>
        ) : (
          <Send size={20} />
        )}

        <AnimatePresence>
          {ripplePosition && (
            <motion.div
              className="ripple-effect"
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                left: ripplePosition.x,
                top: ripplePosition.y,
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.3)',
                pointerEvents: 'none'
              }}
            />
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default MessageInput;
