# 🔥 Firebase Setup Guide

## Шаг 1: Создать Firebase проект

1. Зайдите на https://console.firebase.google.com/
2. Нажмите **"Add project"** (Создать проект)
3. Введите название проекта (например: `kino-sync`)
4. Отключите Google Analytics (не обязательно)
5. Нажмите **"Create project"**

## Шаг 2: Получить конфигурацию Firebase

1. В Firebase Console нажмите значок **⚙️ Settings** рядом с "Project Overview"
2. Выберите **"Project settings"**
3. Пролистайте вниз до раздела **"Your apps"**
4. Нажмите иконку **Web** (`</>`)
5. Введите название приложения (например: `kino-web`)
6. Скопируйте `firebaseConfig` объект

## Шаг 3: Вставить конфигурацию в проект

Откройте файл `src/firebase/config.js` и замените значения:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",           // Ваш API ключ
  authDomain: "kino-sync.firebaseapp.com",
  projectId: "kino-sync",
  storageBucket: "kino-sync.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Шаг 4: Включить Google Authentication

1. В Firebase Console перейдите в **"Build"** → **"Authentication"**
2. Нажмите **"Get started"**
3. Перейдите во вкладку **"Sign-in method"**
4. Нажмите **"Google"** → Включить (Enable)
5. Введите **Project support email** (ваш email)
6. Нажмите **"Save"**

## Шаг 5: Создать Firestore Database

1. В Firebase Console перейдите в **"Build"** → **"Firestore Database"**
2. Нажмите **"Create database"**
3. Выберите **"Start in test mode"** (для разработки)
   - ⚠️ Позже нужно настроить правила безопасности!
4. Выберите lokasiю сервера (ближайшую к вам)
5. Нажмите **"Enable"**

## Шаг 6: Настроить правила безопасности Firestore

Для продакшена настройте правила:

1. Перейдите в **"Firestore Database"** → вкладка **"Rules"**
2. Вставьте следующие правила:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Пользователи могут читать/записывать только свои данные
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Нажмите **"Publish"**

## Шаг 7: Добавить AuthButton в приложение

Откройте `src/App.js` или компонент сайдбара и добавьте:

```jsx
import AuthButton from './firebase/AuthButton';

// В вашем компоненте:
<AuthButton />
```

## Шаг 8: Запустить приложение

```bash
npm start
```

## Проверка работы

1. Откройте приложение
2. Нажмите **"Войти через Google"**
3. Войдите через Google аккаунт
4. Добавьте фильмы в избранное/буду смотреть
5. Откройте приложение на другом устройстве
6. Войдите через тот же Google аккаунт
7. ✅ Данные должны синхронизироваться автоматически!

## Firebase Free Tier Limits

- **Firestore:**
  - 1 GB хранилища
  - 50,000 чтений/день
  - 20,000 записей/день
  - 20,000 удалений/день

- **Authentication:**
  - 10 MAU (месячных активных пользователей) бесплатно
  - Google Sign-In бесплатно

Этого достаточно для личного использования!

## Troubleshooting

### Ошибка "auth/unauthorized-domain"
Добавьте ваш домен в Firebase Console:
- Authentication → Settings → Authorized domains
- Добавьте `localhost` для разработки

### Ошибка "permission-denied" в Firestore
Проверьте правила безопасности (Шаг 6)

### Данные не синхронизируются
1. Проверьте консоль браузера на ошибки
2. Убедитесь что вошли через один и тот же Google аккаунт
3. Проверьте что Firestore Database создан
