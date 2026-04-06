import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "./auth";

const SUBSCRIPTIONS_COLLECTION = "subscriptions";

// ============================================
// Управление подписками
// ============================================

/**
 * Создать ID подписки
 */
const createSubscriptionId = (subscriberId, targetUserId) => {
  return `${subscriberId}_${targetUserId}`;
};

/**
 * Подписаться на пользователя
 */
export const subscribeToUser = async (
  subscriberId,
  targetUserId,
  targetData,
  subscriberData = {}
) => {
  try {
    const subscriptionId = createSubscriptionId(
      subscriberId,
      targetUserId
    );
    const subscriptionRef = doc(
      db,
      SUBSCRIPTIONS_COLLECTION,
      subscriptionId
    );

    await setDoc(subscriptionRef, {
      subscriberId,
      targetUserId,
      subscriberName:
        subscriberData.name || subscriberData.displayName || "",
      subscriberEmail: subscriberData.email || "",
      subscriberAvatar: subscriberData.avatar || "",
      targetName: targetData.name || "Anonymous",
      targetEmail: targetData.email || "",
      targetAvatar: targetData.avatar || "",
      createdAt: serverTimestamp(),
    });

    console.log("[Subscriptions] Subscribed to:", targetUserId);
    return { success: true, id: subscriptionId };
  } catch (error) {
    console.error("[Subscriptions] Subscribe error:", error.message);
    throw error;
  }
};

/**
 * Отписаться от пользователя
 */
export const unsubscribeFromUser = async (subscriberId, targetUserId) => {
  try {
    const subscriptionId = createSubscriptionId(
      subscriberId,
      targetUserId
    );
    const subscriptionRef = doc(
      db,
      SUBSCRIPTIONS_COLLECTION,
      subscriptionId
    );
    await deleteDoc(subscriptionRef);

    console.log("[Subscriptions] Unsubscribed from:", targetUserId);
    return true;
  } catch (error) {
    console.error(
      "[Subscriptions] Unsubscribe error:",
      error.message
    );
    throw error;
  }
};

// ============================================
// Проверка подписок
// ============================================

/**
 * Проверить, подписан ли пользователь на другого
 */
export const isSubscribed = async (subscriberId, targetUserId) => {
  try {
    const subscriptionId = createSubscriptionId(
      subscriberId,
      targetUserId
    );
    const subscriptionRef = doc(
      db,
      SUBSCRIPTIONS_COLLECTION,
      subscriptionId
    );
    const subscriptionSnap = await getDoc(subscriptionRef);
    return subscriptionSnap.exists();
  } catch (error) {
    console.error(
      "[Subscriptions] Check subscription error:",
      error.message
    );
    return false;
  }
};

// ============================================
// Получение списков подписок
// ============================================

/**
 * Получить список подписок пользователя (на кого подписан)
 */
export const getSubscriptions = async (userId) => {
  try {
    const subscriptionsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
    const q = query(
      subscriptionsRef,
      where("subscriberId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const subscriptions = [];

    snapshot.forEach((doc) => {
      subscriptions.push({ id: doc.id, ...doc.data() });
    });

    return subscriptions;
  } catch (error) {
    console.error(
      "[Subscriptions] Get subscriptions error:",
      error.message
    );
    return [];
  }
};

/**
 * Получить подписчиков пользователя (кто на него подписан)
 */
export const getSubscribers = async (userId) => {
  try {
    const subscriptionsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
    const q = query(
      subscriptionsRef,
      where("targetUserId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const subscribers = [];

    snapshot.forEach((doc) => {
      subscribers.push({ id: doc.id, ...doc.data() });
    });

    return subscribers;
  } catch (error) {
    console.error(
      "[Subscriptions] Get subscribers error:",
      error.message
    );
    return [];
  }
};

// ============================================
// Real-time подписки
// ============================================

/**
 * Подписаться на список подписок (real-time)
 */
export const subscribeToSubscriptions = (userId, callback) => {
  try {
    const subscriptionsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
    const q = query(
      subscriptionsRef,
      where("subscriberId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const subscriptions = [];
        snapshot.forEach((doc) => {
          subscriptions.push({ id: doc.id, ...doc.data() });
        });
        callback(subscriptions);
      },
      (error) => {
        console.error(
          "[Subscriptions] Subscribe error:",
          error.message
        );
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error(
      "[Subscriptions] Subscribe setup error:",
      error.message
    );
    return null;
  }
};

// ============================================
// Статистика подписчиков
// ============================================

/**
 * Получить количество подписчиков
 */
export const getSubscriberCount = async (userId) => {
  try {
    const subscriptionsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
    const q = query(
      subscriptionsRef,
      where("targetUserId", "==", userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error(
      "[Subscriptions] Get subscriber count error:",
      error.message
    );
    return 0;
  }
};

/**
 * Получить список подписчиков с их данными
 */
export const getSubscribersWithUserData = async (userId) => {
  try {
    console.log("[Subscriptions] Getting subscribers for:", userId);

    const subscriptionsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
    const q = query(
      subscriptionsRef,
      where("targetUserId", "==", userId)
    );

    const snapshot = await getDocs(q);
    const subscribers = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      subscribers.push({
        id: doc.id,
        subscriberId: data.subscriberId,
        subscriberName:
          data.subscriberName || data.targetName || "Unknown",
        subscriberEmail: data.subscriberEmail || data.targetEmail || "",
        subscriberAvatar:
          data.subscriberAvatar || data.targetAvatar || "",
        ...data,
      });
    });

    console.log(
      "[Subscriptions] Found subscribers:",
      subscribers.length,
      subscribers
    );
    return subscribers;
  } catch (error) {
    console.error(
      "[Subscriptions] Get subscribers with user data error:",
      error.message
    );
    return [];
  }
};
