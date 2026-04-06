import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Search, User, MessageCircle, Film, Tv } from "lucide-react";
import { getAllUsers, initializeChat, shareContentToChat } from "../firebase/messages";
import { subscribeToUserChats } from "../firebase/messages";
import { useUser } from "../context/UserContext";

const IMAGE_BASE = "https://image.tmdb.org/t/p/w54";

/**
 * Модальное окно для отправки фильма/сериала в чат
 * @param {function} props.onChatOpen - Callback: открыть чат с получателем (chatId, user)
 */
const ShareToChatModal = ({
  t,
  isOpen,
  onClose,
  contentItem,
  onChatOpen,
}) => {
  const { firebaseUser, profile } = useUser();
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Загрузка пользователей и чатов
  useEffect(() => {
    if (!isOpen || !firebaseUser) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [allUsers] = await Promise.all([getAllUsers()]);

        // Исключаем текущего пользователя
        const filteredUsers = allUsers.filter(
          (u) => u.id !== firebaseUser.uid
        );
        setUsers(filteredUsers);
      } catch (error) {
        console.error("[ShareToChatModal] Load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, firebaseUser]);

  // Подписка на чаты
  useEffect(() => {
    if (!firebaseUser || !isOpen) return;

    const unsubscribe = subscribeToUserChats(firebaseUser.uid, (chatsData) => {
      setChats(chatsData);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseUser, isOpen]);

  // Фильтрация пользователей
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  // Получаем информацию о чате для пользователя
  const getUserChat = useCallback(
    (userId) => {
      return chats.find((chat) =>
        chat.participants.includes(userId)
      );
    },
    [chats]
  );

  // Отправка контента
  const handleSend = async (userId) => {
    if (!contentItem || !firebaseUser || sending) return;

    setSending(true);
    try {
      const otherUser = users.find((u) => u.id === userId);
      if (!otherUser) return;

      // Профиль отправителя (берём из контекста + доп. данные)
      const senderProfile = {
        name: profile?.name || firebaseUser.displayName || "Anonymous",
        avatar: profile?.avatar || firebaseUser.photoURL || "",
        email: profile?.email || firebaseUser.email || "",
      };

      // Профиль получателя
      const receiverProfile = {
        name: otherUser.name || "Anonymous",
        avatar: otherUser.avatar || "",
        email: otherUser.email || "",
      };

      // Инициализируем чат если его нет
      const chatId = await initializeChat(
        firebaseUser.uid,
        userId,
        senderProfile,
        receiverProfile
      );

      // Отправляем контент в чат
      await shareContentToChat(
        chatId,
        firebaseUser.uid,
        senderProfile,
        contentItem,
        message
      );

      // Закрываем модалку
      onClose();

      // Открываем чат с получателем
      if (onChatOpen) {
        onChatOpen(chatId, {
          id: userId,
          name: otherUser.name,
          avatar: otherUser.avatar,
          email: otherUser.email,
        });
      }
    } catch (error) {
      console.error("[ShareToChatModal] Share error:", error);
      alert("Ошибка при отправке в чат: " + error.message);
    } finally {
      setSending(false);
    }
  };

  const contentTitle = contentItem?.title || contentItem?.name || "";
  const mediaType =
    contentItem?.media_type ||
    (contentItem?.first_air_date ? "tv" : "movie");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="share-to-chat-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="share-to-chat-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="share-to-chat-header">
            <div className="share-to-chat-title-row">
              <MessageCircle size={20} />
              <h2>Поделиться в чате</h2>
            </div>
            <button
              className="share-to-chat-close"
              onClick={onClose}
              aria-label="Закрыть"
            >
              <X size={24} />
            </button>
          </div>

          {/* Информация о контенте */}
          {contentTitle && (
            <div className="share-to-chat-content-info">
              {contentItem?.poster_path && (
                <img
                  src={`${IMAGE_BASE}${contentItem.poster_path}`}
                  alt={contentTitle}
                  className="share-to-chat-content-poster"
                />
              )}
              <div className="share-to-chat-content-meta">
                <span className="share-to-chat-content-type">
                  {mediaType === "movie" ? (
                    <Film size={14} />
                  ) : (
                    <Tv size={14} />
                  )}
                  {mediaType === "movie" ? "Фильм" : "Сериал"}
                </span>
                <h3 className="share-to-chat-content-title">
                  {contentTitle}
                </h3>
              </div>
            </div>
          )}

          {/* Поиск */}
          <div className="share-to-chat-search">
            <Search size={18} className="share-to-chat-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск собеседника..."
              className="share-to-chat-search-input"
            />
          </div>

          {/* Список пользователей */}
          <div className="share-to-chat-users">
            {loading ? (
              <div className="share-to-chat-loading">Загрузка...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="share-to-chat-empty">
                Пользователи не найдены
              </div>
            ) : (
              filteredUsers.map((user) => {
                const existingChat = getUserChat(user.id);
                return (
                  <button
                    key={user.id}
                    className="share-to-chat-user-item"
                    onClick={() => handleSend(user.id)}
                    disabled={sending}
                  >
                    <div className="share-to-chat-user-avatar">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="share-to-chat-user-avatar-img"
                        />
                      ) : (
                        <div className="share-to-chat-user-avatar-placeholder">
                          <User size={18} />
                        </div>
                      )}
                    </div>
                    <div className="share-to-chat-user-info">
                      <span className="share-to-chat-user-name">
                        {user.name || "Аноним"}
                      </span>
                      <span className="share-to-chat-user-email">
                        {user.email}
                      </span>
                    </div>
                    {existingChat && (
                      <span className="share-to-chat-existing-badge">
                        В чате
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Сообщение */}
          <div className="share-to-chat-message-area">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Добавить комментарий (необязательно)..."
              className="share-to-chat-message-input"
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Быстрая отправка всем */}
          {!sending && (
            <div className="share-to-chat-quick-send">
              <p className="share-to-chat-quick-send-hint">
                Или выберите собеседника из списка выше ↑
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareToChatModal;
