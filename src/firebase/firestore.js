import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./auth";
import { validateUserData } from "../utils/validation";

const USERS_COLLECTION = "users";

// ============================================
// Поиск пользователя по email
// ============================================

/**
 * Проверить, существует ли документ с данным email
 * @param {string} email - Email пользователя
 * @returns {string|null} ID пользователя или null
 */
export const findUserByEmail = async (email) => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where("profile.email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    return null;
  } catch (error) {
    console.error("[Firestore] Email search error:", error.message);
    return null;
  }
};

// ============================================
// CRUD операции с данными пользователя
// ============================================

/**
 * Сохранить данные пользователя в Firestore
 * @param {string} userId - ID пользователя
 * @param {object} userData - Данные для сохранения
 */
export const saveUserData = async (userId, userData) => {
  try {
    // Валидация данных перед сохранением
    const validatedData = validateUserData(userData);

    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userRef,
      {
        ...validatedData,
        profile: {
          ...validatedData.profile,
          email: validatedData.profile?.email || null,
        },
      },
      { merge: true }
    );
  } catch (error) {
    if (error.name === 'ValidationError') {
      console.error("[Firestore] Validation error:", error.message);
    }
    console.error("[Firestore] Save error:", error.message);
    throw error;
  }
};

/**
 * Загрузить данные пользователя из Firestore
 * @param {string} userId - ID пользователя
 * @returns {object|null} Данные пользователя или null
 */
export const loadUserData = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(userRef);

    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("[Firestore] Load error:", error.message);
    throw error;
  }
};

// ============================================
// Подписки на изменения (real-time)
// ============================================

/**
 * Подписаться на изменения данных пользователя
 * @param {string} userId - ID пользователя
 * @param {function} callback - Функция обратного вызова
 * @returns {function|null} Функция отписки
 */
export const subscribeToUserData = (userId, callback) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data());
        }
      },
      (error) => {
        console.error("[Firestore] Subscribe error:", error.message);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("[Firestore] Subscribe setup error:", error.message);
    return null;
  }
};

// ============================================
// Удаление данных
// ============================================

/**
 * Удалить данные пользователя
 * @param {string} userId - ID пользователя
 */
export const deleteUserData = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("[Firestore] Delete error:", error.message);
    throw error;
  }
};

// ============================================
// Онлайн-статус (lastSeen)
// ============================================

/**
 * Обновить время последней активности
 * @param {string} userId - ID пользователя
 */
export const updateLastSeen = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const now = new Date().toISOString();
    await setDoc(userRef, { lastSeen: now }, { merge: true });
    console.log(`[Firestore] ✅ lastSeen updated: ${now}`);
  } catch (error) {
    console.error("[Firestore] LastSeen update error:", error.message);
  }
};

/**
 * Подписаться на онлайн-статус пользователя
 * @param {string} userId - ID пользователя
 * @param {function} callback - Функция обратного вызова (isOnline)
 * @returns {function|null} Функция отписки
 */
export const subscribeToUserPresence = (userId, callback) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 минуты
    let lastSeenValue = null;
    let checkInterval = null;

    const checkOnline = () => {
      if (!lastSeenValue) return;
      const lastSeen = new Date(lastSeenValue).getTime();
      const isOnline = Date.now() - lastSeen < ONLINE_THRESHOLD;
      callback({ isOnline, lastSeen: lastSeenValue });
    };

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          lastSeenValue = data.lastSeen || null;
          const lastSeen = lastSeenValue ? new Date(lastSeenValue).getTime() : 0;
          const isOnline = Date.now() - lastSeen < ONLINE_THRESHOLD;
          callback({ isOnline, lastSeen: lastSeenValue });
        } else {
          lastSeenValue = null;
          callback({ isOnline: false, lastSeen: null });
        }
      },
      (error) => {
        console.error("[Firestore] Presence subscribe error:", error.message);
      }
    );

    // Локальный перерасчёт каждые 30 сек — чтобы отловить когда heartbeat остановился
    checkInterval = setInterval(checkOnline, 30 * 1000);

    return () => {
      unsubscribe();
      if (checkInterval) clearInterval(checkInterval);
    };
  } catch (error) {
    console.error("[Firestore] Presence setup error:", error.message);
    return null;
  }
};

// ============================================
// Инициализация
// ============================================

/**
 * Инициализировать данные пользователя (при первом входе)
 * @param {string} userId - ID пользователя
 * @param {object} profile - Профиль пользователя
 * @returns {object|null} Данные пользователя
 */
export const initializeUserData = async (userId, profile) => {
  const existingData = await loadUserData(userId);

  if (!existingData) {
    await saveUserData(userId, {
      profile: profile || { name: "", avatar: "" },
      favorites: [],
      watched: [],
      watchlist: [],
      createdAt: new Date().toISOString(),
    });
  }

  return loadUserData(userId);
};
