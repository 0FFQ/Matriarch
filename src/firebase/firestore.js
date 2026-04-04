import { doc, setDoc, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from './auth';

const USERS_COLLECTION = 'users';

/**
 * Сохранить данные пользователя в Firestore
 */
export const saveUserData = async (userId, userData) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('[Firestore] Data saved for user:', userId);
  } catch (error) {
    console.error('[Firestore] Save error:', error.message);
    throw error;
  }
};

/**
 * Загрузить данные пользователя из Firestore
 */
export const loadUserData = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      console.log('[Firestore] Data loaded for user:', userId);
      return docSnap.data();
    } else {
      console.log('[Firestore] No data for user:', userId);
      return null;
    }
  } catch (error) {
    console.error('[Firestore] Load error:', error.message);
    throw error;
  }
};

/**
 * Подписаться на изменения данных пользователя (real-time)
 */
export const subscribeToUserData = (userId, callback) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        console.log('[Firestore] Real-time update received');
        callback(docSnap.data());
      }
    }, (error) => {
      console.error('[Firestore] Subscribe error:', error.message);
    });

    return unsubscribe;
  } catch (error) {
    console.error('[Firestore] Subscribe setup error:', error.message);
    return null;
  }
};

/**
 * Удалить данные пользователя
 */
export const deleteUserData = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
    console.log('[Firestore] User data deleted:', userId);
  } catch (error) {
    console.error('[Firestore] Delete error:', error.message);
    throw error;
  }
};

/**
 * Инициализировать данные пользователя (при первом входе)
 */
export const initializeUserData = async (userId, profile) => {
  const existingData = await loadUserData(userId);
  
  if (!existingData) {
    await saveUserData(userId, {
      profile: profile || { name: '', avatar: '' },
      favorites: [],
      watched: [],
      watchlist: [],
      createdAt: new Date().toISOString()
    });
    console.log('[Firestore] User data initialized');
  }
  
  return loadUserData(userId);
};
