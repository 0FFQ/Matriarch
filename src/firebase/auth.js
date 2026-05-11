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




const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();


googleProvider.setCustomParameters({
  prompt: "select_account",
});


setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("[Auth] Persistence error:", error.message);
});






export const signInWithGoogle = async () => {
  try {
    
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


export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("[Auth] Logout error:", error.message);
    throw error;
  }
};


export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};


export const getCurrentUser = () => {
  return auth.currentUser;
};


export const hasSavedAccount = () => {
  return !!localStorage.getItem(
    "firebase:authUser:" + firebaseConfig.apiKey
  );
};

export default app;
