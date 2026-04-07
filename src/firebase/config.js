/**
 * Firebase конфигурация
 *
 * Получить новые значения можно в Firebase Console:
 * https://console.firebase.google.com/
 *
 * Проект: kino-77b4b
 *
 * Переменные окружения (.env):
 * REACT_APP_FIREBASE_API_KEY
 * REACT_APP_FIREBASE_AUTH_DOMAIN
 * REACT_APP_FIREBASE_PROJECT_ID
 * REACT_APP_FIREBASE_STORAGE_BUCKET
 * REACT_APP_FIREBASE_MESSAGING_SENDER_ID
 * REACT_APP_FIREBASE_APP_ID
 * REACT_APP_FIREBASE_MEASUREMENT_ID
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Проверка наличия обязательных переменных
const requiredVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_APP_ID',
];

const missing = requiredVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(
    `[Config] Отсутствуют переменные окружения Firebase: ${missing.join(', ')}. Создайте файл .env на основе .env.example`
  );
}

export default firebaseConfig;
