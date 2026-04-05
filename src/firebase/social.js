import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from './auth';

const SHARED_CONTENT_COLLECTION = 'sharedContent';
const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

/**
 * Поделиться фильмом/сериалом с другим пользователем
 */
export const shareContent = async (sharedBy, sharedWith, contentItem, message = '') => {
  try {
    // Создаем запись о шаринге
    const shareData = {
      sharedBy,
      sharedWith,
      content: {
        id: contentItem.id,
        title: contentItem.title || contentItem.name,
        poster_path: contentItem.poster_path,
        media_type: contentItem.media_type || (contentItem.first_air_date ? 'tv' : 'movie'),
        overview: contentItem.overview,
        vote_average: contentItem.vote_average,
        release_date: contentItem.release_date || contentItem.first_air_date,
      },
      message: message.trim(),
      sharedAt: serverTimestamp(),
      read: false
    };

    const shareDoc = await addDoc(collection(db, SHARED_CONTENT_COLLECTION), shareData);

    // Создаем уведомление для получателя
    const notificationData = {
      userId: sharedWith,
      type: 'content_shared',
      title: 'Вам поделились контентом',
      description: message.trim() || `Посмотрите "${shareData.content.title}"`,
      sharedContentId: shareDoc.id,
      fromUserId: sharedBy,
      read: false,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);

    console.log('[Share] Content shared successfully');
    return shareDoc.id;
  } catch (error) {
    console.error('[Share] Share error:', error.message);
    throw error;
  }
};

/**
 * Подписаться на контент, которым поделились с текущим пользователем (real-time)
 */
export const subscribeToSharedContent = (userId, callback) => {
  try {
    const sharedRef = collection(db, SHARED_CONTENT_COLLECTION);
    const q = query(
      sharedRef,
      where('sharedWith', '==', userId)
    );

    let isAlive = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isAlive) return;
      const sharedItems = [];
      snapshot.forEach((doc) => {
        sharedItems.push({ id: doc.id, ...doc.data() });
      });
      sharedItems.sort((a, b) => {
        const timeA = a.sharedAt?.toMillis ? a.sharedAt.toMillis() : 0;
        const timeB = b.sharedAt?.toMillis ? b.sharedAt.toMillis() : 0;
        return timeB - timeA;
      });
      callback(sharedItems);
    }, (error) => {
      if (error.message?.includes('Unexpected state') ||
          error.message?.includes('INTERNAL ASSERTION FAILED') ||
          error.code === 'internal') {
        return;
      }
      console.error('[SharedContent] Subscribe error:', error.message);
    });

    return () => {
      isAlive = false;
      try {
        unsubscribe();
      } catch (e) {
        // Ignore unsubscribe errors
      }
    };
  } catch (error) {
    console.error('[SharedContent] Subscribe setup error:', error.message);
    return () => {};
  }
};

/**
 * Подписаться на контент, которым пользователь поделился (real-time)
 */
export const subscribeToUserSharedContent = (userId, callback) => {
  try {
    const sharedRef = collection(db, SHARED_CONTENT_COLLECTION);
    const q = query(
      sharedRef,
      where('sharedBy', '==', userId)
    );

    let isAlive = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isAlive) return;
      const sharedItems = [];
      snapshot.forEach((doc) => {
        sharedItems.push({ id: doc.id, ...doc.data() });
      });
      sharedItems.sort((a, b) => {
        const timeA = a.sharedAt?.toMillis ? a.sharedAt.toMillis() : 0;
        const timeB = b.sharedAt?.toMillis ? b.sharedAt.toMillis() : 0;
        return timeB - timeA;
      });
      callback(sharedItems);
    }, (error) => {
      if (error.message?.includes('Unexpected state') ||
          error.message?.includes('INTERNAL ASSERTION FAILED') ||
          error.code === 'internal') {
        return;
      }
      console.error('[SharedContent] User subscribe error:', error.message);
    });

    return () => {
      isAlive = false;
      try {
        unsubscribe();
      } catch (e) {
        // Ignore unsubscribe errors
      }
    };
  } catch (error) {
    console.error('[SharedContent] User subscribe setup error:', error.message);
    return () => {};
  }
};

/**
 * Пометить шаринг как прочитанный
 */
export const markSharedAsRead = async (sharedId) => {
  try {
    const shareRef = doc(db, SHARED_CONTENT_COLLECTION, sharedId);
    await updateDoc(shareRef, { read: true });
  } catch (error) {
    console.error('[Share] Mark as read error:', error.message);
  }
};

/**
 * Удалить шаринг
 */
export const deleteSharedContent = async (sharedId, userId) => {
  try {
    const shareRef = doc(db, SHARED_CONTENT_COLLECTION, sharedId);
    const shareDoc = await getDoc(shareRef);
    
    if (shareDoc.exists() && shareDoc.data().sharedBy === userId) {
      await deleteDoc(shareRef);
      console.log('[Share] Content deleted');
    }
  } catch (error) {
    console.error('[Share] Delete error:', error.message);
    throw error;
  }
};

/**
 * Подписаться на уведомления пользователя (real-time)
 */
export const subscribeToNotifications = (userId, callback) => {
  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifRef,
      where('userId', '==', userId)
    );

    let isAlive = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isAlive) return;
      const notifications = [];
      snapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      notifications.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      callback(notifications);
    }, (error) => {
      if (error.message?.includes('Unexpected state') ||
          error.message?.includes('INTERNAL ASSERTION FAILED') ||
          error.code === 'internal') {
        return;
      }
      console.error('[Notifications] Subscribe error:', error.message);
    });

    return () => {
      isAlive = false;
      try {
        unsubscribe();
      } catch (e) {
        // Ignore unsubscribe errors
      }
    };
  } catch (error) {
    console.error('[Notifications] Subscribe setup error:', error.message);
    return () => {};
  }
};

/**
 * Пометить уведомление как прочитанное
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    console.error('[Notifications] Mark as read error:', error.message);
  }
};

/**
 * Пометить все уведомления как прочитанные
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const updates = [];
    snapshot.forEach((doc) => {
      updates.push(updateDoc(doc.ref, { read: true }));
    });

    await Promise.all(updates);
    console.log('[Notifications] All marked as read');
  } catch (error) {
    console.error('[Notifications] Mark all as read error:', error.message);
  }
};

/**
 * Удалить уведомление
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    const notifDoc = await getDoc(notifRef);
    
    if (notifDoc.exists() && notifDoc.data().userId === userId) {
      await deleteDoc(notifRef);
      console.log('[Notifications] Notification deleted');
    }
  } catch (error) {
    console.error('[Notifications] Delete error:', error.message);
    throw error;
  }
};

/**
 * Получить количество непрочитанных уведомлений
 */
export const getUnreadNotificationsCount = async (userId) => {
  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('[Notifications] Unread count error:', error.message);
    return 0;
  }
};

/**
 * Получить профиль пользователя по ID (для отображения в шаринге/уведомлениях)
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: userId,
        ...data.profile
      };
    }
    return null;
  } catch (error) {
    console.error('[Users] Get profile error:', error.message);
    return null;
  }
};

export default {
  shareContent,
  subscribeToSharedContent,
  subscribeToUserSharedContent,
  markSharedAsRead,
  deleteSharedContent,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationsCount,
  getUserProfile
};
