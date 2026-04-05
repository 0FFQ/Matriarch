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
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from './auth';

const MESSAGES_COLLECTION = 'messages';
const CHATS_COLLECTION = 'chats';
const USERS_COLLECTION = 'users';

/**
 * Получить ID чата между двумя пользователями (отсортированный для уникальности)
 */
const getChatId = (userId1, userId2) => {
  return userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
};

/**
 * Отправить сообщение
 */
export const sendMessage = async (chatId, senderId, senderProfile, text) => {
  try {
    const messageData = {
      chatId,
      senderId,
      senderName: senderProfile.name || 'Anonymous',
      senderAvatar: senderProfile.avatar || '',
      senderEmail: senderProfile.email || '',
      text: text.trim(),
      createdAt: serverTimestamp(),
      read: false
    };

    // Добавляем сообщение в коллекцию сообщений
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

    // Обновляем документ чата (последнее сообщение, время)
    // Отправитель автоматически прочитывает своё сообщение
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      const data = chatSnap.data();
      if (data.lastMessageReadBy) {
        // lastMessageReadBy существует — обновляем точечно
        await updateDoc(chatRef, {
          participants: chatId.split('_'),
          lastMessage: text.trim().substring(0, 100),
          lastMessageTime: serverTimestamp(),
          lastSenderId: senderId,
          lastSenderName: senderProfile.name || 'Anonymous',
          [`lastMessageReadBy.${senderId}`]: true,
          updatedAt: serverTimestamp()
        });
      } else {
        // lastMessageReadBy нет — создаём
        await updateDoc(chatRef, {
          participants: chatId.split('_'),
          lastMessage: text.trim().substring(0, 100),
          lastMessageTime: serverTimestamp(),
          lastSenderId: senderId,
          lastSenderName: senderProfile.name || 'Anonymous',
          lastMessageReadBy: { [senderId]: true },
          updatedAt: serverTimestamp()
        });
      }
    }
    // Если документ не существует — он будет создан через initializeChat

    return docRef.id;
  } catch (error) {
    console.error('[Messages] Send error:', error.message);
    throw error;
  }
};

/**
 * Подписаться на сообщения в чате (real-time)
 */
export const subscribeToMessages = (chatId, callback) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    // Используем только where без orderBy чтобы избежать необходимости в индексе
    const q = query(
      messagesRef,
      where('chatId', '==', chatId)
    );

    let isAlive = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isAlive) return;
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      // Сортируем на клиенте по createdAt
      messages.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeA - timeB;
      });
      callback(messages);
    }, (error) => {
      // Игнорируем все ошибки "Unexpected state" и связанные с внутренним состоянием
      if (error.message?.includes('Unexpected state') ||
          error.message?.includes('INTERNAL ASSERTION FAILED') ||
          error.code === 'internal') {
        return;
      }
      console.error('[Messages] Subscribe error:', error.message);
    });

    // Возвращаем обёртку, которая проверяет isAlive
    return () => {
      isAlive = false;
      try {
        unsubscribe();
      } catch (e) {
        // Игнорируем ошибки при отписке
      }
    };
  } catch (error) {
    console.error('[Messages] Subscribe setup error:', error.message);
    return () => {}; // Возвращаем пустую функцию вместо null
  }
};

/**
 * Подписаться на все чаты пользователя (real-time)
 */
export const subscribeToUserChats = (userId, callback) => {
  try {
    const chatsRef = collection(db, CHATS_COLLECTION);
    // Используем только where без orderBy чтобы избежать необходимости в индексе
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId)
    );

    let isAlive = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isAlive) return;
      const chats = [];
      snapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() });
      });
      // Сортируем на клиенте по updatedAt (новые сверху)
      chats.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return timeB - timeA;
      });
      callback(chats);
    }, (error) => {
      // Игнорируем все ошибки "Unexpected state" и связанные с внутренним состоянием
      if (error.message?.includes('Unexpected state') ||
          error.message?.includes('INTERNAL ASSERTION FAILED') ||
          error.code === 'internal') {
        return;
      }
      console.error('[Chats] Subscribe error:', error.message);
    });

    // Возвращаем обёртку, которая проверяет isAlive
    return () => {
      isAlive = false;
      try {
        unsubscribe();
      } catch (e) {
        // Игнорируем ошибки при отписке
      }
    };
  } catch (error) {
    console.error('[Chats] Subscribe setup error:', error.message);
    return () => {}; // Возвращаем пустую функцию вместо null
  }
};

/**
 * Получить список всех пользователей (для поиска собеседника)
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
      const email = profile.email || data.email || '';
      const name = profile.name || data.name || '';
      const avatar = profile.avatar || data.avatar || '';
      
      if (email || name) {
        users.push({ id: doc.id, name, email, avatar, ...profile, ...data });
      }
    });

    return users;
  } catch (error) {
    console.error('[Users] Fetch error:', error.message);
    return [];
  }
};

/**
 * Пометить сообщения как прочитанные
 */
export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    // Запрашиваем все сообщения чата без составного where (чтобы не требовать индекс)
    const q = query(
      messagesRef,
      where('chatId', '==', chatId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const unreadMessages = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Фильтруем на клиенте: не от текущего пользователя и не прочитанные
      if (data.senderId !== userId && data.read !== true) {
        unreadMessages.push(docSnap.ref);
      }
    });

    if (unreadMessages.length === 0) return;

    // Помечаем как прочитанные
    await Promise.all(
      unreadMessages.map((ref) => updateDoc(ref, { read: true }))
    );

    // Обновляем документ чата — помечаем что текущий пользователь прочитал последнее сообщение
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      const data = chatSnap.data();
      if (data.lastMessageReadBy) {
        await updateDoc(chatRef, {
          [`lastMessageReadBy.${userId}`]: true
        });
      } else {
        await updateDoc(chatRef, {
          lastMessageReadBy: { [userId]: true }
        });
      }
    }
  } catch (error) {
    console.error('[Messages] Mark as read error:', error.message);
  }
};

/**
 * Получить количество непрочитанных сообщений в чате
 */
export const getUnreadCount = async (chatId, userId) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    // Только chatId без составного индекса
    const q = query(
      messagesRef,
      where('chatId', '==', chatId)
    );

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
    console.error('[Messages] Unread count error:', error.message);
    return 0;
  }
};

/**
 * Инициализировать чат между двумя пользователями
 */
export const initializeChat = async (userId1, userId2, profile1, profile2) => {
  const chatId = getChatId(userId1, userId2);
  const chatRef = doc(db, CHATS_COLLECTION, chatId);

  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      participants: [userId1, userId2],
      participantProfiles: {
        [userId1]: { name: profile1.name, avatar: profile1.avatar, email: profile1.email },
        [userId2]: { name: profile2.name, avatar: profile2.avatar, email: profile2.email }
      },
      lastMessageReadBy: {
        [userId1]: true,
        [userId2]: true
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
  initializeChat,
  getChatId
};
