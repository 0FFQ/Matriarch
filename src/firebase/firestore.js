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






export const saveUserData = async (userId, userData) => {
  try {
    
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






export const deleteUserData = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("[Firestore] Delete error:", error.message);
    throw error;
  }
};






export const updateLastSeen = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const now = new Date().toISOString();
    await setDoc(userRef, { lastSeen: now }, { merge: true });
  } catch (error) {
    console.error("[Firestore] LastSeen update error:", error.message);
  }
};


export const subscribeToUserPresence = (userId, callback) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const ONLINE_THRESHOLD = 30 * 1000; 
    const CHECK_INTERVAL = 10 * 1000; 
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

    
    checkInterval = setInterval(checkOnline, CHECK_INTERVAL);

    return () => {
      unsubscribe();
      if (checkInterval) clearInterval(checkInterval);
    };
  } catch (error) {
    console.error("[Firestore] Presence setup error:", error.message);
    return null;
  }
};






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
