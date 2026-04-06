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
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userRef,
      {
        ...userData,
        updatedAt: new Date().toISOString(),
        profile: {
          ...userData.profile,
          email: userData.profile?.email || null,
        },
      },
      { merge: true }
    );
  } catch (error) {
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
