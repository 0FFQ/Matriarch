import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "./auth";
import { validateMessageData } from "../utils/validation";

const MESSAGES_COLLECTION = "messages";
const CHATS_COLLECTION = "chats";
const USERS_COLLECTION = "users";

// ============================================
// Утилиты
// ============================================

/**
 * Получить ID чата между двумя пользователями
 * (отсортированный для уникальности)
 */
const getChatId = (userId1, userId2) => {
  return userId1 < userId2
    ? `${userId1}_${userId2}`
    : `${userId2}_${userId1}`;
};

/**
 * Проверка на ошибку внутреннего состояния Firebase
 */
const isInternalFirebaseError = (error) => {
  const message = error?.message || "";
  return (
    message.includes("Unexpected state") ||
    message.includes("INTERNAL ASSERTION FAILED") ||
    error?.code === "internal"
  );
};

/**
 * Безопасная отписка от snapshot
 */
const safeUnsubscribe = (unsubscribe) => {
  try {
    unsubscribe();
  } catch {
    // Игнорируем ошибки при отписке
  }
};

// ============================================
// Отправка сообщений
// ============================================

/**
 * Отправить сообщение в чат
 */
export const sendMessage = async (chatId, senderId, senderProfile, text) => {
  try {
    // Валидация данных сообщения
    const validated = validateMessageData(senderId, senderProfile, text);

    const messageData = {
      chatId,
      senderId: validated.senderId,
      senderName: validated.senderName,
      senderAvatar: validated.senderAvatar,
      text: validated.text,
      createdAt: serverTimestamp(),
      read: false,
    };

    // Добавляем сообщение в коллекцию
    const docRef = await addDoc(
      collection(db, MESSAGES_COLLECTION),
      messageData
    );

    // Обновляем документ чата
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      const updateData = {
        participants: chatId.split("_"),
        lastMessage: text.trim().substring(0, 100),
        lastMessageTime: serverTimestamp(),
        lastSenderId: senderId,
        lastSenderName: senderProfile.name || "Anonymous",
        updatedAt: serverTimestamp(),
      };

      // Обновляем статус прочтения для отправителя
      if (chatSnap.data().lastMessageReadBy) {
        updateData[`lastMessageReadBy.${senderId}`] = true;
      } else {
        updateData.lastMessageReadBy = { [senderId]: true };
      }

      await updateDoc(chatRef, updateData);
    }

    return docRef.id;
  } catch (error) {
    console.error("[Messages] Send error:", error.message);
    throw error;
  }
};

// ============================================
// Подписки на сообщения и чаты (real-time)
// ============================================

/**
 * Подписаться на сообщения в чате
 */
export const subscribeToMessages = (chatId, callback) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(messagesRef, where("chatId", "==", chatId));

    let isAlive = true;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isAlive) return;

        const messages = [];
        snapshot.forEach((doc) => {
          messages.push({ id: doc.id, ...doc.data() });
        });

        // Сортируем на клиенте по времени создания
        messages.sort((a, b) => {
          const timeA = a.createdAt?.toMillis
            ? a.createdAt.toMillis()
            : 0;
          const timeB = b.createdAt?.toMillis
            ? b.createdAt.toMillis()
            : 0;
          return timeA - timeB;
        });

        callback(messages);
      },
      (error) => {
        if (!isInternalFirebaseError(error)) {
          console.error("[Messages] Subscribe error:", error.message);
        }
      }
    );

    // Возвращаем обёртку с проверкой isAlive
    return () => {
      isAlive = false;
      safeUnsubscribe(unsubscribe);
    };
  } catch (error) {
    console.error("[Messages] Subscribe setup error:", error.message);
    return () => {};
  }
};

/**
 * Подписаться на все чаты пользователя
 */
export const subscribeToUserChats = (userId, callback) => {
  try {
    const chatsRef = collection(db, CHATS_COLLECTION);
    const q = query(chatsRef, where("participants", "array-contains", userId));

    let isAlive = true;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isAlive) return;

        const chats = [];
        snapshot.forEach((doc) => {
          chats.push({ id: doc.id, ...doc.data() });
        });

        // Сортируем на клиенте (новые сверху)
        chats.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis
            ? a.updatedAt.toMillis()
            : 0;
          const timeB = b.updatedAt?.toMillis
            ? b.updatedAt.toMillis()
            : 0;
          return timeB - timeA;
        });

        callback(chats);
      },
      (error) => {
        if (!isInternalFirebaseError(error)) {
          console.error("[Chats] Subscribe error:", error.message);
        }
      }
    );

    return () => {
      isAlive = false;
      safeUnsubscribe(unsubscribe);
    };
  } catch (error) {
    console.error("[Chats] Subscribe setup error:", error.message);
    return () => {};
  }
};

// ============================================
// Управление пользователями
// ============================================

/**
 * Получить список всех пользователей
 */
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, limit(100));
    const snapshot = await getDocs(q);
    const users = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const profile = data.profile || data;

      const email = profile.email || data.email || "";
      const name = profile.name || data.name || "";
      const avatar = profile.avatar || data.avatar || "";
      const lastSeen = data.lastSeen || null;

      if (email || name) {
        users.push({ id: doc.id, name, email, avatar, lastSeen, ...profile, ...data });
      }
    });

    return users;
  } catch (error) {
    console.error("[Users] Fetch error:", error.message);
    return [];
  }
};

// ============================================
// Статус прочтения сообщений
// ============================================

/**
 * Удалить сообщение (только отправитель может удалить)
 */
export const deleteMessage = async (messageId, senderId, currentUserId) => {
  if (senderId !== currentUserId) {
    throw new Error("Можно удалять только свои сообщения");
  }

  try {
    const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
    const msgSnap = await getDoc(msgRef);

    if (!msgSnap.exists()) return;

    const chatId = msgSnap.data().chatId;

    // Проверяем, последнее ли это сообщение в чате
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(messagesRef, where("chatId", "==", chatId));
    const snapshot = await getDocs(q);

    const messages = [];
    snapshot.forEach((doc) => messages.push({ id: doc.id, ...doc.data() }));
    messages.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });

    const isLastMessage = messages[0]?.id === messageId;

    // Удаляем сообщение
    await deleteDoc(msgRef);

    // Если это было последнее сообщение — обновляем чат
    if (isLastMessage && messages.length > 1) {
      const chatRef = doc(db, CHATS_COLLECTION, chatId);
      const nextMsg = messages[1];
      await updateDoc(chatRef, {
        lastMessage: nextMsg.text?.substring(0, 100) || "🎬 Контент",
        lastMessageTime: nextMsg.createdAt,
        lastSenderId: nextMsg.senderId,
        lastSenderName: nextMsg.senderName || "Anonymous",
      });
    }
  } catch (error) {
    console.error("[Messages] Delete error:", error.message);
    throw error;
  }
};

/**
 * Пометить сообщения как прочитанные
 */
export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(messagesRef, where("chatId", "==", chatId));

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    // Фильтруем непрочитанные сообщения не от текущего пользователя
    const unreadMessages = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.senderId !== userId && data.read !== true) {
        unreadMessages.push(docSnap.ref);
      }
    });

    if (unreadMessages.length === 0) return;

    // Помечаем как прочитанные
    await Promise.all(
      unreadMessages.map((ref) => updateDoc(ref, { read: true }))
    );

    // Обновляем статус прочтения в документе чата
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      const updateData = chatSnap.data().lastMessageReadBy
        ? { [`lastMessageReadBy.${userId}`]: true }
        : { lastMessageReadBy: { [userId]: true } };

      await updateDoc(chatRef, updateData);
    }
  } catch (error) {
    console.error("[Messages] Mark as read error:", error.message);
  }
};

/**
 * Получить количество непрочитанных сообщений в чате
 */
export const getUnreadCount = async (chatId, userId) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(messagesRef, where("chatId", "==", chatId));

    const snapshot = await getDocs(q);
    let count = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.senderId !== userId && data.read !== true) {
        count++;
      }
    });

    return count;
  } catch (error) {
    console.error("[Messages] Unread count error:", error.message);
    return 0;
  }
};

// ============================================
// Отправка контента в чат
// ============================================

/**
 * Отправить фильм/сериал в чат как сообщение с прикреплённым контентом
 * @param {string} chatId - ID чата
 * @param {string} senderId - ID отправителя
 * @param {object} senderProfile - Профиль отправителя
 * @param {object} contentItem - Элемент контента (фильм/сериал)
 * @param {string} message - Дополнительное сообщение
 */
export const shareContentToChat = async (
  chatId,
  senderId,
  senderProfile,
  contentItem,
  message = ""
) => {
  try {
    const validated = validateMessageData(
      senderId,
      senderProfile,
      message || '🎬 Поделились контентом'
    );

    const messageData = {
      chatId,
      senderId: validated.senderId,
      senderName: validated.senderName,
      senderAvatar: validated.senderAvatar,
      text: validated.text,
      contentType: "shared_media",
      content: {
        id: contentItem.id,
        title: contentItem.title || contentItem.name,
        poster_path: contentItem.poster_path,
        media_type:
          contentItem.media_type ||
          (contentItem.first_air_date ? "tv" : "movie"),
        overview: contentItem.overview,
        vote_average: contentItem.vote_average,
        release_date:
          contentItem.release_date || contentItem.first_air_date,
      },
      createdAt: serverTimestamp(),
      read: false,
    };

    // Добавляем сообщение в коллекцию
    const docRef = await addDoc(
      collection(db, MESSAGES_COLLECTION),
      messageData
    );

    // Обновляем документ чата
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      const contentTitle = messageData.content.title;
      const updateData = {
        participants: chatId.split("_"),
        lastMessage: message.trim()
          ? message.trim().substring(0, 100)
          : `🎬 ${contentTitle}`,
        lastMessageTime: serverTimestamp(),
        lastSenderId: senderId,
        lastSenderName: senderProfile.name || "Anonymous",
        updatedAt: serverTimestamp(),
      };

      if (chatSnap.data().lastMessageReadBy) {
        updateData[`lastMessageReadBy.${senderId}`] = true;
      } else {
        updateData.lastMessageReadBy = { [senderId]: true };
      }

      await updateDoc(chatRef, updateData);
    }

    return docRef.id;
  } catch (error) {
    console.error("[Messages] Share content error:", error.message);
    throw error;
  }
};

// ============================================
// Инициализация чатов
// ============================================

/**
 * Инициализировать чат между двумя пользователями
 */
export const initializeChat = async (
  userId1,
  userId2,
  profile1,
  profile2
) => {
  const chatId = getChatId(userId1, userId2);
  const chatRef = doc(db, CHATS_COLLECTION, chatId);

  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [userId1, userId2],
      participantProfiles: {
        [userId1]: {
          name: profile1.name,
          avatar: profile1.avatar,
          email: profile1.email,
        },
        [userId2]: {
          name: profile2.name,
          avatar: profile2.avatar,
          email: profile2.email,
        },
      },
      lastMessageReadBy: {
        [userId1]: true,
        [userId2]: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return chatId;
};

export default {
  sendMessage,
  subscribeToMessages,
  subscribeToUserChats,
  getAllUsers,
  markMessagesAsRead,
  getUnreadCount,
  shareContentToChat,
  initializeChat,
  getChatId,
  deleteMessage,
};
