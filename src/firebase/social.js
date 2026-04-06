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
  deleteDoc,
} from "firebase/firestore";
import { db } from "./auth";

const SHARED_CONTENT_COLLECTION = "sharedContent";
const NOTIFICATIONS_COLLECTION = "notifications";
const USERS_COLLECTION = "users";

// ============================================
// Утилиты подписок
// ============================================

/**
 * Создать safe-обёртку для onSnapshot
 * @param {function} queryFn - Функция создания запроса
 * @param {function} transformFn - Функция трансформации данных (mutates in place)
 * @param {function} callback - Функция обратного вызова с результатами
 * @param {function} errorCallback - Обработчик ошибок
 */
const createSafeSubscription = (queryFn, transformFn, callback, errorCallback) => {
  try {
    const q = queryFn();
    let isAlive = true;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isAlive) return;

        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });

        transformFn(items);
        callback(items);
      },
      (error) => {
        const message = error?.message || "";
        if (
          !message.includes("Unexpected state") &&
          !message.includes("INTERNAL ASSERTION FAILED") &&
          error?.code !== "internal"
        ) {
          errorCallback(error);
        }
      }
    );

    return () => {
      isAlive = false;
      try {
        unsubscribe();
      } catch {
        // Игнорируем ошибки при отписке
      }
    };
  } catch (error) {
    errorCallback(error);
    return () => {};
  }
};

/**
 * Сортировка по времени (новые сверху)
 */
const sortByDateDesc = (items, field) => {
  return items.sort((a, b) => {
    const timeA = a[field]?.toMillis ? a[field].toMillis() : 0;
    const timeB = b[field]?.toMillis ? b[field].toMillis() : 0;
    return timeB - timeA;
  });
};

// ============================================
// Общий контент (Sharing)
// ============================================

/**
 * Поделиться фильмом/сериалом с другим пользователем
 */
export const shareContent = async (
  sharedBy,
  sharedWith,
  contentItem,
  message = ""
) => {
  try {
    const shareData = {
      sharedBy,
      sharedWith,
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
      message: message.trim(),
      sharedAt: serverTimestamp(),
      read: false,
    };

    // Создаём запись о шаринге
    const shareDoc = await addDoc(
      collection(db, SHARED_CONTENT_COLLECTION),
      shareData
    );

    // Создаём уведомление для получателя
    const notificationData = {
      userId: sharedWith,
      type: "content_shared",
      title: "Вам поделились контентом",
      description:
        message.trim() || `Посмотрите "${shareData.content.title}"`,
      sharedContentId: shareDoc.id,
      fromUserId: sharedBy,
      read: false,
      createdAt: serverTimestamp(),
    };

    await addDoc(
      collection(db, NOTIFICATIONS_COLLECTION),
      notificationData
    );

    console.log("[Share] Content shared successfully");
    return shareDoc.id;
  } catch (error) {
    console.error("[Share] Share error:", error.message);
    throw error;
  }
};

/**
 * Подписаться на контент, которым поделились с пользователем
 */
export const subscribeToSharedContent = (userId, callback) => {
  return createSafeSubscription(
    () =>
      query(
        collection(db, SHARED_CONTENT_COLLECTION),
        where("sharedWith", "==", userId)
      ),
    (items) => sortByDateDesc(items, "sharedAt"),
    callback,
    (error) =>
      console.error("[SharedContent] Subscribe error:", error.message)
  );
};

/**
 * Подписаться на контент, которым пользователь поделился
 */
export const subscribeToUserSharedContent = (userId, callback) => {
  return createSafeSubscription(
    () =>
      query(
        collection(db, SHARED_CONTENT_COLLECTION),
        where("sharedBy", "==", userId)
      ),
    (items) => sortByDateDesc(items, "sharedAt"),
    callback,
    (error) =>
      console.error(
        "[SharedContent] User subscribe error:",
        error.message
      )
  );
};

/**
 * Пометить шаринг как прочитанный
 */
export const markSharedAsRead = async (sharedId) => {
  try {
    const shareRef = doc(db, SHARED_CONTENT_COLLECTION, sharedId);
    await updateDoc(shareRef, { read: true });
  } catch (error) {
    console.error("[Share] Mark as read error:", error.message);
  }
};

/**
 * Удалить шаринг (только автор может удалить)
 */
export const deleteSharedContent = async (sharedId, userId) => {
  try {
    const shareRef = doc(db, SHARED_CONTENT_COLLECTION, sharedId);
    const shareDoc = await getDoc(shareRef);

    if (shareDoc.exists() && shareDoc.data().sharedBy === userId) {
      await deleteDoc(shareRef);
      console.log("[Share] Content deleted");
    }
  } catch (error) {
    console.error("[Share] Delete error:", error.message);
    throw error;
  }
};

// ============================================
// Уведомления
// ============================================

/**
 * Подписаться на уведомления пользователя
 */
export const subscribeToNotifications = (userId, callback) => {
  return createSafeSubscription(
    () =>
      query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where("userId", "==", userId)
      ),
    (items) => sortByDateDesc(items, "createdAt"),
    callback,
    (error) =>
      console.error("[Notifications] Subscribe error:", error.message)
  );
};

/**
 * Пометить уведомление как прочитанное
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    console.error(
      "[Notifications] Mark as read error:",
      error.message
    );
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
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    const updates = [];
    snapshot.forEach((doc) => {
      updates.push(updateDoc(doc.ref, { read: true }));
    });

    await Promise.all(updates);
    console.log("[Notifications] All marked as read");
  } catch (error) {
    console.error(
      "[Notifications] Mark all as read error:",
      error.message
    );
  }
};

/**
 * Удалить уведомление (только владелец может удалить)
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    const notifDoc = await getDoc(notifRef);

    if (notifDoc.exists() && notifDoc.data().userId === userId) {
      await deleteDoc(notifRef);
      console.log("[Notifications] Notification deleted");
    }
  } catch (error) {
    console.error("[Notifications] Delete error:", error.message);
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
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("[Notifications] Unread count error:", error.message);
    return 0;
  }
};

// ============================================
// Профили пользователей
// ============================================

/**
 * Получить профиль пользователя по ID
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return { id: userId, ...data.profile };
    }
    return null;
  } catch (error) {
    console.error("[Users] Get profile error:", error.message);
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
  getUserProfile,
};
