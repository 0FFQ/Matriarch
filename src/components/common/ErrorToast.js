import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

/**
 * Компонент всплывающего уведомления об ошибке
 */
const ErrorToast = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="error-toast"
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth: '90vw',
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.4,
              flex: 1,
            }}
          >
            {message}
          </p>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 6,
              padding: 4,
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorToast;
