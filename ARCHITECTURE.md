# Архитектура приложения Matriarch

## 📁 Структура проекта

```
src/
├── App.js                      # Точка входа (17 строк!)
├── constants.js                # Константы API, кэша, пагинации
├── translations.js             # Словарь переводов (ru-RU, en-US)
│
├── hooks/                      # Кастомные хуки
│   ├── index.js               # Экспорт всех хуков
│   ├── useThemeLanguage.js    # Управление темой и языком
│   ├── useSearch.js           # Логика поиска и фильтров
│   ├── useMessenger.js        # Состояние мессенджера
│   ├── useTrailer.js          # Управление трейлерами
│   ├── useAppState.js         # UI состояние (меню, профиль, фильтры)
│   ├── useSocialIntegration.js # Социальные обработчики
│   ├── useTrailerControls.js  # Обработчики трейлера
│   ├── usePaginationControls.js # Управление пагинацией
│   └── useKeyboardShortcuts.js # Клавиатурные сокращения
│
├── components/                 # UI компоненты
│   ├── index.js              # Экспорт всех компонентов
│   ├── AppLayout.js          # Основная структура (меню, сайдбар)
│   ├── SearchSection.js      # Поисковая строка
│   ├── ResultsSection.js     # Результаты + пагинация
│   ├── SearchAndResults.js   # Комбинированный компонент
│   ├── TrailerSection.js     # Трейлер + "нет трейлера"
│   ├── MessengerSection.js   # Мессенджер + шаринг
│   ├── SocialIntegration.js  # Социальные функции
│   ├── LoadingOverlay.js     # Индикатор загрузки
│   ├── NoTrailerWidget.js    # Виджет "трейлер не найден"
│   └── PaginationControls.js # Кнопки пагинации
│
├── containers/                 # Контейнеры
│   └── AppContainer.js        # Главный контейнер приложения
│
├── utils/                      # Утилиты
│   ├── cache.js               # Кэширование запросов
│   └── searchUtils.js         # Функции сортировки
│
└── context/                    # React контекст
    └── UserContext.js         # Контекст пользователя
```

## 🎯 Архитектурные принципы

### 1. Разделение ответственности
- **Хуки** - содержат только логику и состояние
- **Компоненты** - отвечают только за рендеринг
- **Контейнеры** - объединяют хуки и компоненты

### 2. Композиция вместо наследования
Каждый компонент маленький и переиспользуемый

### 3. Внедрение зависимостей
Хуки передаются как пропсы в компоненты

## 📊 Метрики

| Файл | Было | Стало |
|------|------|-------|
| **App.js** | 997 строк | **17 строк** |
| **Модульность** | 1 файл | **25+ модулей** |
| **Хуков** | 0 | **10** |
| **Компонентов** | 12 | **20+** |

## 🔧 Хуки

### useThemeLanguage
Управление темной/светлой темой и переключением языков

### useSearch
Полная логика поиска, фильтрации и жанров

### useMessenger
Состояние чатов, уведомлений, шаринга

### useTrailer
Загрузка и отображение трейлеров

### useAppState
Управление UI состоянием (меню, профиль, фильтры)

### useSocialIntegration
Обработчики для социальных функций

### useTrailerControls
Обработчики для управления трейлером

### usePaginationControls
Логика пагинации с кешированием

### useKeyboardShortcuts
Обработка горячих клавиш

## 🧩 Компоненты

### AppLayout
Основная структура приложения:
- MenuToggle
- Sidebar
- UserProfile
- FilterPanel
- InteractiveAtom

### SearchSection
Поисковая строка с подсказками

### ResultsSection
Список результатов с пагинацией

### TrailerSection
Отображение трейлера или заглушки

### MessengerSection
Кнопка мессенджера и модалка шаринга

## 📝 Примеры использования

### Добавление нового хука

```javascript
// 1. Создаем хук
// hooks/useNewFeature.js
const useNewFeature = () => {
  const [state, setState] = useState(null);
  // логика...
  return { state, setState };
};
export default useNewFeature;

// 2. Добавляем в индекс
// hooks/index.js
export { default as useNewFeature } from './useNewFeature';

// 3. Используем в контейнере
// containers/AppContainer.js
const { state, setState } = useNewFeature();
```

### Добавление нового компонента

```javascript
// 1. Создаем компонент
// components/NewComponent.js
const NewComponent = ({ prop1, prop2 }) => {
  return <div>{prop1}</div>;
};
export default NewComponent;

// 2. Добавляем в индекс
// components/index.js
export { default as NewComponent } from './NewComponent';

// 3. Используем
import NewComponent from './components/NewComponent';
<NewComponent prop1="value" />
```

## 🚀 Преимущества архитектуры

1. **Тестируемость** - каждый хук/компонент тестируется отдельно
2. **Переиспользование** - хуки и компоненты используются повторно
3. **Масштабируемость** - легко добавлять новые функции
4. **Читаемость** - код легко понять и поддерживать
5. **Производительность** - мемоизация и оптимизация в хуках

## 📦 Сборка

```bash
npm run build  # Продакшен сборка
npm start      # Dev сервер
```

Все функции сохранены без изменений! ✅
