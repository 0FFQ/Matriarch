import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './config';

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Инициализация Firebase сервисов
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Настраиваем провайдер Google
googleProvider.setCustomParameters({
  // Показывать аккаунт по умолчанию (без выбора если один аккаунт)
  prompt: 'select_account'
});

// Устанавливаем персистентность (сохранение сессии)
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error('[Auth] Persistence error:', error.message);
});

// Подавляем Cross-Origin-Opener-Policy warnings (это просто шум от Firebase SDK)
const originalError = console.error;
console.error = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('Cross-Origin-Opener-Policy')) {
    return; // Игнорируем эти предупреждения
  }
  originalError.apply(console, args);
};

// Вход через Google
export const signInWithGoogle = async () => {
  try {
    if (auth.currentUser) {
      return auth.currentUser;
    }

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return user;
  } catch (error) {
    if (error.code !== 'auth/popup-closed-by-user') {
      console.error('[Auth] Sign in error:', error.message);
      throw error;
    }
    return null;
  }
};

// Выход
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('[Auth] Logout error:', error.message);
    throw error;
  }
};

// Слушатель состояния аутентификации
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// Получить текущего пользователя
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Проверить, сохранён ли аккаунт
export const hasSavedAccount = () => {
  return !!localStorage.getItem('firebase:authUser:' + firebaseConfig.apiKey);
};

export default app;
