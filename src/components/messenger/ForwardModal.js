import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ExternalLink, Copy, Check } from 'lucide-react';
import { getAllUsers, initializeChat, sendMessage } from '../../firebase/messages';
import { useUser } from '../../context/UserContext';

const ForwardModal = ({ isOpen, onClose, message, currentChatId, onChatOpen }) => {
  const { firebaseUser, profile } = useUser();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [forwarding, setForwarding] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const loadUsers = async () => {
      const all = await getAllUsers();
      setUsers(all.filter(u => u.id !== firebaseUser?.uid));
    };
    loadUsers();
  }, [isOpen, firebaseUser]);

  const handleForwardToUser = useCallback(async (targetUser) => {
    if (!firebaseUser?.uid || !profile || !message || !targetUser?.id) {
      console.error('[ForwardModal] Missing required data:', {
        hasFirebaseUid: !!firebaseUser?.uid,
        hasProfile: !!profile,
        hasMessage: !!message,
        hasTargetId: !!targetUser?.id,
      });
      return;
    }
    setForwarding(targetUser.id);

    try {
      // Формируем ID чата (отсортированный)
      const chatId = firebaseUser.uid < targetUser.id
        ? `${firebaseUser.uid}_${targetUser.id}`
        : `${targetUser.id}_${firebaseUser.uid}`;

      // Подготавливаем профиль отправителя
      const senderProfile = {
        name: profile.name || firebaseUser.displayName || 'Пользователь',
        avatar: profile.avatar || firebaseUser.photoURL || '',
        email: profile.email || firebaseUser.email || '',
      };

      // Профиль получателя
      const receiverProfile = {
        name: targetUser.name || '',
        avatar: targetUser.avatar || '',
        email: targetUser.email || '',
      };

      // Инициализируем чат если не существует
      await initializeChat(firebaseUser.uid, targetUser.id, senderProfile, receiverProfile);

      // Формируем текст пересланного сообщения с информацией об отправителе
      let forwardedFrom;

      if (message.forwardedFrom) {
        // Уже пересланное — сохраняем оригинального автора
        forwardedFrom = message.forwardedFrom;
      } else if (!message.senderId || message.senderId === firebaseUser.uid) {
        // Своё сообщение — текущий пользователь
        forwardedFrom = {
          name: senderProfile.name,
          avatar: senderProfile.avatar,
        };
      } else {
        // Чужое сообщение — оригинальный автор
        forwardedFrom = {
          name: message.senderName || 'Пользователь',
          avatar: message.senderAvatar || '',
        };
      }

      const forwardData = {
        text: message.text || '',
        forwardedFrom,
      };

      await sendMessage(chatId, firebaseUser.uid, senderProfile, JSON.stringify(forwardData));

      // Закрываем модалку и открываем чат
      onClose();
      if (onChatOpen) {
        onChatOpen(chatId, {
          id: targetUser.id,
          name: targetUser.name,
          avatar: targetUser.avatar,
          email: targetUser.email,
        });
      }
    } catch (error) {
      console.error('[ForwardModal] Forward error:', error);
    } finally {
      setForwarding(null);
    }
  }, [firebaseUser, profile, message]);

  const handleForwardToTelegram = useCallback(() => {
    if (!message?.text) return;
    const text = encodeURIComponent(message.text);
    const url = `https://t.me/share/url?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  }, [message, onClose]);

  const handleCopyText = useCallback(() => {
    if (!message?.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message]);

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!message) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="forward-modal-overlay" onClick={onClose}>
          <motion.div
            className="forward-modal"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="forward-modal-header">
              <h3>Переслать сообщение</h3>
              <button className="forward-modal-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* Превью сообщения */}
            <div className="forward-message-preview">
              <p className="forward-message-text">{message.text || '📎 Вложение'}</p>
              <div className="forward-message-actions">
                <button
                  className="forward-action-btn"
                  onClick={handleCopyText}
                  title="Копировать текст"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Скопировано' : 'Копировать'}
                </button>
                <button
                  className="forward-action-btn forward-telegram-btn"
                  onClick={handleForwardToTelegram}
                  title="Переслать в Telegram"
                >
                  <ExternalLink size={14} />
                  В Telegram
                </button>
              </div>
            </div>

            {/* Поиск */}
            <div className="forward-search">
              <input
                type="text"
                placeholder="Поиск пользователя..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Список пользователей */}
            <div className="forward-users-list">
              {filteredUsers.length === 0 ? (
                <div className="forward-empty">Нет пользователей</div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="forward-user-item"
                    onClick={() => handleForwardToUser(user)}
                  >
                    <div className="forward-user-avatar">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                      ) : (
                        <div className="forward-user-avatar-placeholder">
                          {(user.name || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="forward-user-info">
                      <div className="forward-user-name">{user.name}</div>
                      <div className="forward-user-email">{user.email}</div>
                    </div>
                    {forwarding === user.id && (
                      <div className="forward-spinner" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ForwardModal;
