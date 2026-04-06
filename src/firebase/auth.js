import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "./config";

// ============================================
// Инициализация Firebase
// ============================================
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Настройка провайдера Google
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Установка персистентности (сохранение сессии)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("[Auth] Persistence error:", error.message);
});

// ============================================
// Подавление Cross-Origin-Opener-Policy warnings
// (это шум от Firebase SDK, не влияющий на работу)
// ============================================
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0];
  if (
    typeof message === "string" &&
    message.includes("Cross-Origin-Opener-Policy")
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// ============================================
// Аутентификация
// ============================================

/**
 * Войти через Google
 * @returns {object|null} Объект пользователя или null
 */
export const signInWithGoogle = async () => {
  try {
    // Если уже авторизован — возвращаем текущего пользователя
    if (auth.currentUser) {
      return auth.currentUser;
    }

    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    if (error.code !== "auth/popup-closed-by-user") {
      console.error("[Auth] Sign in error:", error.message);
      throw error;
    }
    return null;
  }
};

/**
 * Выйти из аккаунта
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("[Auth] Logout error:", error.message);
    throw error;
  }
};

/**
 * Подписаться на изменение состояния аутентификации
 * @param {function} callback - Функция обратного вызова
 * @returns {function} Функция отписки
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

/**
 * Получить текущего авторизованного пользователя
 * @returns {object|null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Проверить, сохранён ли аккаунт в localStorage
 * @returns {boolean}
 */
export const hasSavedAccount = () => {
  return !!localStorage.getItem(
    "firebase:authUser:" + firebaseConfig.apiKey
  );
};

export default app;
