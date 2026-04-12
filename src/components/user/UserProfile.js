import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { User, Edit2, X, Camera, Heart, Eye, Bookmark, ExternalLink, Trash2, Film, Tv, CheckCircle, Cloud, LogIn, AlertTriangle, Users, UserPlus, UserMinus, Bell, BellOff } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { signInWithGoogle, logout, onAuthChange } from '../../firebase/auth';
import { getAllUsers } from '../../firebase/messages';
import { subscribeToUser, unsubscribeFromUser, isSubscribed, getSubscribersWithUserData } from '../../firebase/subscriptions';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

const UserProfile = ({ t, isOpen, onClose, onBackToMenu }) => {
  const {
    profile,
    updateProfile,
    favorites,
    watched,
    watchlist,
    removeFromFavorites,
    removeFromWatched,
    removeFromWatchlist,
    forceSaveToFirestore,
    isAuthenticated,
    syncEnabled,
    syncError,
  } = useUser();

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Следим за состоянием авторизации
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        console.error('Sign in error:', error);
        alert('Ошибка входа: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      // Выходим из Google (данные уже сохранены в Firestore автоматически через debounce 500ms)
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name || '');
  const [activeTab, setActiveTab] = useState('favorites');
  const [activeCategory, setActiveCategory] = useState('all'); // all, movie, tv, anime
  
  // Состояние для вкладки пользователей
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showUsersList, setShowUsersList] = useState(false); // Показывать ли список пользователей
  const [subscriptionStatuses, setSubscriptionStatuses] = useState({}); // На кого подписан
  const [subscriptionActionsLoading, setSubscriptionActionsLoading] = useState({}); // Загрузка действий
  const [usersView, setUsersView] = useState('all'); // 'all', 'subscribed', или 'subscribers'
  const [subscribersList, setSubscribersList] = useState([]); // Список подписчиков
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  
  // Количество других пользователей (исключая текущего)
  const otherUsersCount = usersList.filter(u => !firebaseUser || u.id !== firebaseUser.uid).length;
  const subscribedCount = usersList.filter(u => 
    (!firebaseUser || u.id !== firebaseUser.uid) && subscriptionStatuses[u.id]
  ).length;
  const subscribersCount = subscribersList.length;
  
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragControls = useDragControls();
  const panelRef = useRef(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  useEffect(() => {
    if (isOpen && panelRef.current) {
      const headerEl = panelRef.current.querySelector('.filter-header');
      const headerHeight = headerEl ? headerEl.offsetHeight : 70;
      const panelHeight = panelRef.current.offsetHeight;
      const initialTop = 16;
      const maxTranslateY = window.innerHeight - initialTop - headerHeight;
      setConstraints({
        left: -(window.innerWidth - 420),
        right: 0,
        top: 0,
        bottom: Math.max(0, maxTranslateY)
      });
    }
  }, [isOpen]);

  useEffect(() => {
    setEditName(profile.name || '');
  }, [profile.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Загрузка пользователей при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  // Фильтрация пользователей по поиску и виду
  useEffect(() => {
    // Если режим "подписчики" - используем список подписчиков
    if (usersView === 'subscribers') {
      if (usersSearch.trim() === '') {
        setFilteredUsers(subscribersList.map(sub => ({
          id: sub.subscriberId,
          name: sub.subscriberName,
          email: sub.subscriberEmail,
          avatar: sub.subscriberAvatar
        })));
      } else {
        const query = usersSearch.toLowerCase();
        const filtered = subscribersList
          .filter(sub =>
            (sub.subscriberName || '').toLowerCase().includes(query) ||
            (sub.subscriberEmail || '').toLowerCase().includes(query)
          )
          .map(sub => ({
            id: sub.subscriberId,
            name: sub.subscriberName,
            email: sub.subscriberEmail,
            avatar: sub.subscriberAvatar
          }));
        setFilteredUsers(filtered);
      }
      return;
    }
    
    // Для "все" и "подписки" - используем usersList
    let baseUsers = usersList.filter(user => 
      !firebaseUser || user.id !== firebaseUser.uid
    );
    
    // Если режим "подписанные" - фильтруем только тех на кого подписаны
    if (usersView === 'subscribed') {
      baseUsers = baseUsers.filter(user => subscriptionStatuses[user.id]);
    }
    
    if (usersSearch.trim() === '') {
      setFilteredUsers(baseUsers);
    } else {
      const query = usersSearch.toLowerCase();
      const filtered = baseUsers.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [usersSearch, usersList, firebaseUser, usersView, subscriptionStatuses, subscribersList]);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      console.log('[UserProfile] Loading users...');
      const allUsers = await getAllUsers();
      console.log('[UserProfile] Users loaded:', allUsers);
      setUsersList(allUsers);
      setFilteredUsers(allUsers);
      
      // Загружаем статусы подписок для всех пользователей
      if (firebaseUser) {
        await loadSubscriptionStatuses(allUsers, firebaseUser.uid);
        // Загружаем подписчиков
        await loadSubscribers(firebaseUser.uid);
      }
    } catch (err) {
      console.error('[UserProfile] Error loading users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadSubscribers = async (userId) => {
    try {
      console.log('[UserProfile] Loading subscribers...');
      setSubscribersLoading(true);
      const subscribers = await getSubscribersWithUserData(userId);
      console.log('[UserProfile] Subscribers loaded:', subscribers);
      setSubscribersList(subscribers);
    } catch (err) {
      console.error('[UserProfile] Error loading subscribers:', err);
    } finally {
      setSubscribersLoading(false);
    }
  };

  const loadSubscriptionStatuses = async (users, currentUserId) => {
    try {
      const statuses = {};
      await Promise.all(
        users.map(async (user) => {
          if (user.id !== currentUserId) {
            const isSub = await isSubscribed(currentUserId, user.id);
            statuses[user.id] = isSub;
          }
        })
      );
      setSubscriptionStatuses(statuses);
    } catch (err) {
      console.error('[UserProfile] Error loading subscription statuses:', err);
    }
  };

  const handleSubscribe = async (user) => {
    if (!firebaseUser) return;

    try {
      setSubscriptionActionsLoading(prev => ({ ...prev, [user.id]: true }));
      await subscribeToUser(firebaseUser.uid, user.id, {
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }, {
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar
      });

      // Обновляем статус
      setSubscriptionStatuses(prev => ({
        ...prev,
        [user.id]: true
      }));
      
      // Обновляем подписчиков
      if (firebaseUser) {
        await loadSubscribers(firebaseUser.uid);
      }
    } catch (err) {
      console.error('[UserProfile] Error subscribing:', err);
      alert(t === 'ru' ? 'Ошибка при подписке' : 'Error subscribing');
    } finally {
      setSubscriptionActionsLoading(prev => ({ ...prev, [user.id]: false }));
    }
  };

  const handleUnsubscribe = async (user) => {
    if (!firebaseUser) return;
    
    try {
      setSubscriptionActionsLoading(prev => ({ ...prev, [user.id]: true }));
      await unsubscribeFromUser(firebaseUser.uid, user.id);
      
      // Обновляем статус
      setSubscriptionStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[user.id];
        return newStatuses;
      });
    } catch (err) {
      console.error('[UserProfile] Error unsubscribing:', err);
      alert(t === 'ru' ? 'Ошибка при отписке' : 'Error unsubscribing');
    } finally {
      setSubscriptionActionsLoading(prev => ({ ...prev, [user.id]: false }));
    }
  };

  const handleSave = () => {
    if (editName.trim()) {
      updateProfile({ ...profile, name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditName(profile.name || '');
      setIsEditing(false);
    }
  };

  const getAvatarColor = (name) => {
    if (!name) return '#6b7280';
    const colors = [
      '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e', '#6b7280', '#f97316',
      '#eab308', '#9ca3af', '#14b8a6', '#06b6d4',
      '#3b82f6', '#2563eb'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getKinopoiskLink = (item) => {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').split('-')[0];
    const type = item.media_type === 'tv' ? (t.tvSeries || 'TV Series') : (t.movie || 'Movie');
    return `https://www.kinopoisk.ru/search/?query=${encodeURIComponent(`${title} ${year} ${type}`)}`;
  };

  const formatYear = (dateString) => {
    if (!dateString) return '';
    return dateString.split('-')[0];
  };

  const formatRating = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return value.toFixed(1);
  };

  const handleRemove = (id, listType) => {
    switch (listType) {
      case 'favorites':
        removeFromFavorites(id);
        break;
      case 'watched':
        removeFromWatched(id);
        break;
      case 'watchlist':
        removeFromWatchlist(id);
        break;
      default:
        break;
    }
  };

  const getCurrentList = () => {
    let items = [];
    let label = '';
    let emptyMsg = '';

    switch (activeTab) {
      case 'favorites':
        items = favorites;
        label = t.favorites || 'Избранное';
        emptyMsg = t.favoritesEmpty || 'В избранном пока пусто';
        break;
      case 'watched':
        items = watched;
        label = t.watched || 'Просмотренное';
        emptyMsg = t.watchedEmpty || 'Вы ещё ничего не посмотрели';
        break;
      case 'watchlist':
        items = watchlist;
        label = t.watchlist || 'Буду смотреть';
        emptyMsg = t.watchlistEmpty || 'Список "Буду смотреть" пуст';
        break;
      default:
        break;
    }

    // Фильтрация по категории
    if (activeCategory !== 'all') {
      items = items.filter(item => {
        // Определяем, является ли элемент аниме
        const isAnimation = item.genre_ids?.includes(16);
        const hasAnimeKeyword = item.title?.toLowerCase().includes('аниме') || 
                                item.name?.toLowerCase().includes('аниме') || 
                                item.overview?.toLowerCase().includes('аниме') ||
                                item.original_language === 'ja';
        const isAnime = isAnimation && hasAnimeKeyword;

        if (activeCategory === 'anime') {
          return isAnime;
        }
        if (activeCategory === 'tv') {
          // Сериалы, но не аниме
          return (item.media_type === 'tv' || item.media_type === undefined) && !isAnime;
        }
        if (activeCategory === 'movie') {
          return item.media_type === 'movie' || item.media_type === undefined;
        }
        return true;
      });
    }

    return { items, label, emptyMsg };
  };

  const currentList = getCurrentList();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          className="profile-panel"
          drag
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={constraints}
          dragElastic={0}
          dragMomentum={false}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div
            className="filter-header"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: 'grab' }}
          >
            <div className="filter-title">
              <User size={20} />
              <h2>{t.profile || 'Профиль'}</h2>
            </div>
            <div className="profile-header-buttons">
              {onBackToMenu && (
                <button
                  className="filter-back"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBackToMenu();
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
              )}
              <button className="filter-close" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="filter-content">
            {/* Объединённая секция профиля и синхронизации */}
            <div className="filter-section">
              <label className="filter-label">
                <User size={14} style={{ marginRight: '6px' }} />
                {t.profile || 'Профиль'}
              </label>
              <div className="unified-profile-card">
                {/* Верхняя строка: аватар + имя */}
                <div className="profile-header-row">
                  <div className={`profile-avatar-small ${profile.avatar ? 'has-avatar' : ''}`} style={{ background: profile.avatar ? 'transparent' : getAvatarColor(profile.name) }}>
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="avatar" className="profile-avatar-small-img" />
                    ) : (
                      <span className="profile-avatar-small-initials">{getInitials(profile.name)}</span>
                    )}
                    <button
                      className="profile-avatar-small-change"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={12} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateProfile({ ...profile, avatar: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </div>
                  <div className="profile-name-small">
                    {isEditing ? (
                      <div className="profile-name-small-edit">
                        <input
                          ref={inputRef}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={t.profileName || 'Имя'}
                          maxLength={30}
                          className="profile-name-small-input"
                        />
                        <div className="edit-actions-small">
                          <button className="edit-small-btn" onClick={handleSave}>
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="edit-small-btn cancel"
                            onClick={() => {
                              setEditName(profile.name || '');
                              setIsEditing(false);
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="profile-name-small-view">
                        <span className="profile-name-small-display" onClick={() => setIsEditing(true)}>
                          {profile.name || (t.profileNamePlaceholder || 'Ваше имя')}
                        </span>
                        <button className="profile-edit-small-btn" onClick={() => setIsEditing(true)}>
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Статистика */}
                <div className="profile-stats-compact">
                  <div className="stat-compact">
                    <Heart size={14} />
                    <span>{favorites.length}</span>
                  </div>
                  <div className="stat-compact">
                    <Eye size={14} />
                    <span>{watched.length}</span>
                  </div>
                  <div className="stat-compact">
                    <Bookmark size={14} />
                    <span>{watchlist.length}</span>
                  </div>
                </div>

                {/* Разделитель */}
                <div className="profile-divider"></div>

                {/* Синхронизация */}
                {authLoading ? (
                  <div className="sync-compact-loading">
                    <div className="sync-loading-spinner-small"></div>
                  </div>
                ) : syncError ? (
                  <div className="sync-compact-error">
                    <div className="sync-error-content">
                      <AlertTriangle size={16} className="sync-error-icon" />
                      <div className="sync-error-text">
                        <div className="sync-error-title">{syncError}</div>
                        <button className="sync-compact-logout" onClick={handleLogout}>
                          <LogIn size={14} className="rotate-180" />
                          <span>{t.logout || 'Выйти'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : firebaseUser ? (
                  <div className="sync-compact-row">
                    <div className="sync-compact-info">
                      {firebaseUser.photoURL ? (
                        <img
                          src={firebaseUser.photoURL}
                          alt={firebaseUser.displayName}
                          className="sync-compact-avatar"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="sync-compact-avatar-placeholder">
                          <Cloud size={14} />
                        </div>
                      )}
                      <div className="sync-compact-text">
                        <div className="sync-compact-email">{firebaseUser.email}</div>
                        <div className="sync-compact-status">
                          {syncEnabled ? (
                            <>
                              <CheckCircle size={10} />
                              <span>{t.synced || 'Синхронизировано'}</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={10} className="sync-warning" />
                              <span>{t.syncDisabled || 'Синхронизация отключена'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="sync-compact-logout" onClick={handleLogout}>
                      <LogIn size={14} className="rotate-180" />
                    </button>
                  </div>
                ) : (
                  <button className="sync-compact-signin" onClick={handleSignIn}>
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Войти через Google для синхронизации</span>
                  </button>
                )}
              </div>
            </div>

            {/* Вкладки */}
            <div className="filter-section">
              <label className="filter-label">{t.lists || 'Списки'}</label>
              <div className="profile-tabs-row">
                <button
                  className={`profile-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('favorites'); setActiveCategory('all'); }}
                >
                  <Heart size={14} />
                  <span>{t.favorites || 'Избранное'}</span>
                  {favorites.length > 0 && <span className="tab-badge">{favorites.length}</span>}
                </button>
                <button
                  className={`profile-tab-btn ${activeTab === 'watched' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('watched'); setActiveCategory('all'); }}
                >
                  <Eye size={14} />
                  <span>{t.watched || 'Просмотренное'}</span>
                  {watched.length > 0 && <span className="tab-badge">{watched.length}</span>}
                </button>
                <button
                  className={`profile-tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('watchlist'); setActiveCategory('all'); }}
                >
                  <Bookmark size={14} />
                  <span>{t.watchlist || 'Буду смотреть'}</span>
                  {watchlist.length > 0 && <span className="tab-badge">{watchlist.length}</span>}
                </button>
                <button
                  className={`profile-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('users'); }}
                >
                  <Users size={14} />
                  <span>{t.users || 'Пользователи'}</span>
                  {otherUsersCount > 0 && <span className="tab-badge">{otherUsersCount}</span>}
                </button>
              </div>
            </div>

            {/* Категории */}
            <div className="filter-section">
              <label className="filter-label">{t.categories || 'Категории'}</label>
              <div className="profile-category-row">
                <button
                  className={`profile-category-btn ${activeCategory !== 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  {t.allCategories || 'Все'}
                </button>
                <button
                  className={`profile-category-btn ${activeCategory === 'movie' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('movie')}
                >
                  <Film size={14} />
                  <span>{t.categoryMovies || 'Фильмы'}</span>
                </button>
                <button
                  className={`profile-category-btn ${activeCategory === 'tv' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('tv')}
                >
                  <Tv size={14} />
                  <span>{t.categoryTV || 'Сериалы'}</span>
                </button>
                <button
                  className={`profile-category-btn ${activeCategory === 'anime' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('anime')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                  <span>{t.categoryAnime || 'Аниме'}</span>
                </button>
              </div>
            </div>

            {/* Пользователи */}
            {activeTab === 'users' && (
              <div className="filter-section">
                <label className="filter-label">{t.users || 'Пользователи'}</label>
                
                {/* Кнопка для показа списка пользователей */}
                <button
                  className="show-users-btn"
                  onClick={() => {
                    setShowUsersList(!showUsersList);
                    if (!showUsersList && usersList.length === 0) {
                      loadUsers();
                    }
                  }}
                >
                  <Users size={18} />
                  <span>
                    {showUsersList 
                      ? (t.hideUsers || 'Скрыть пользователей') 
                      : `${t.showUsers || 'Показать всех пользователей'}${otherUsersCount > 0 ? ` (${otherUsersCount})` : ''}`
                    }
                  </span>
                  <svg 
                    className={`chevron-icon ${showUsersList ? 'rotated' : ''}`}
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Выпадающий список пользователей */}
                {showUsersList && (
                  <div className="users-dropdown">
                    {/* Переключатель вида */}
                    <div className="users-view-toggle">
                      <button
                        className={`users-view-btn ${usersView === 'all' ? 'active' : ''}`}
                        onClick={() => setUsersView('all')}
                      >
                        <Users size={14} />
                        <span>{t.allUsers || 'Все'}</span>
                        {otherUsersCount > 0 && <span className="view-count">{otherUsersCount}</span>}
                      </button>
                      <button
                        className={`users-view-btn ${usersView === 'subscribed' ? 'active' : ''}`}
                        onClick={() => setUsersView('subscribed')}
                      >
                        <Bell size={14} />
                        <span>{t.mySubscriptions || 'Мои подписки'}</span>
                        {subscribedCount > 0 && <span className="view-count">{subscribedCount}</span>}
                      </button>
                      <button
                        className={`users-view-btn ${usersView === 'subscribers' ? 'active' : ''}`}
                        onClick={() => setUsersView('subscribers')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M22 8v2"/>
                          <path d="M22 11a4 4 0 0 1-3 3.87"/>
                          <path d="M15 16a4 4 0 0 1 0-8"/>
                        </svg>
                        <span>{t.subscribers || 'Подписчики'}</span>
                        {subscribersCount > 0 && <span className="view-count">{subscribersCount}</span>}
                      </button>
                    </div>
                    
                    {/* Поиск пользователей */}
                    <div className="users-search">
                      <input
                        type="text"
                        value={usersSearch}
                        onChange={(e) => setUsersSearch(e.target.value)}
                        placeholder={t.searchUsers || 'Поиск пользователей...'}
                        className="users-search-input"
                      />
                    </div>
                    
                    {/* Список пользователей */}
                    {(usersLoading || (usersView === 'subscribers' && subscribersLoading)) ? (
                      <div className="users-loading">
                        <div className="users-loading-spinner"></div>
                        <p>{t.loading || 'Загрузка...'}</p>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="users-empty">
                        <Users size={48} style={{ opacity: 0.3 }} />
                        <p>{otherUsersCount === 0 ? (t.noUsers || 'Пользователи не найдены') : (t.noUsersFound || 'По запросу ничего не найдено')}</p>
                      </div>
                    ) : (
                      <div className="users-list">
                        {filteredUsers.map(user => {
                          const isSubscribed = subscriptionStatuses[user.id];
                          const isLoading = subscriptionActionsLoading[user.id];
                          
                          return (
                            <div key={user.id} className="user-card">
                              <div className="user-avatar">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} />
                                ) : (
                                  <div className="user-avatar-placeholder">
                                    <User size={24} />
                                  </div>
                                )}
                              </div>
                              <div className="user-info">
                                <h4>{user.name || (t.anonymous || 'Аноним')}</h4>
                                <p className="user-email">{user.email}</p>
                              </div>
                              <div className="user-actions">
                                  {isLoading ? (
                                    <div className="user-action-loading">
                                      <div className="action-loading-spinner"></div>
                                    </div>
                                  ) : isSubscribed ? (
                                    <button
                                      className="unsubscribe-btn"
                                      onClick={() => handleUnsubscribe(user)}
                                    >
                                      <BellOff size={18} />
                                    </button>
                                  ) : (
                                    <button
                                      className="subscribe-btn"
                                      onClick={() => handleSubscribe(user)}
                                    >
                                      <Bell size={18} />
                                    </button>
                                  )}
                                </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Список фильмов */}
            {activeTab !== 'users' && (
            <div className="filter-section profile-list-section">
              {currentList.items.length === 0 ? (
                <div className="profile-list-empty">
                  {activeTab === 'favorites' && <Heart size={32} />}
                  {activeTab === 'watched' && <Eye size={32} />}
                  {activeTab === 'watchlist' && <Bookmark size={32} />}
                  <p>{currentList.emptyMsg}</p>
                </div>
              ) : (
                <div className="profile-list-items">
                  {currentList.items.map(item => (
                    <div key={item.id} className="profile-list-item">
                      <div className="item-poster">
                        {item.poster_path ? (
                          <img src={`${IMAGE_BASE}${item.poster_path}`} alt={item.title || item.name} />
                        ) : (
                          <div className="no-poster">
                            {item.media_type === 'tv' ? <Tv size={20} /> : <Film size={20} />}
                          </div>
                        )}
                      </div>
                      <div className="item-info">
                        <h4>{item.title || item.name}</h4>
                        <div className="item-meta">
                          <span className="item-year">{formatYear(item.release_date || item.first_air_date)}</span>
                          {item.vote_average > 0 && (
                            <span className="item-rating">★ {formatRating(item.vote_average)}</span>
                          )}
                          {(() => {
                            const isAnimation = item.genre_ids?.includes(16);
                            const hasAnimeKeyword = item.title?.toLowerCase().includes('аниме') || 
                                                    item.name?.toLowerCase().includes('аниме') || 
                                                    item.overview?.toLowerCase().includes('аниме') ||
                                                    item.original_language === 'ja';
                            const isAnime = isAnimation && hasAnimeKeyword;
                            const itemType = isAnime ? 'anime' : (item.media_type === 'tv' ? 'tv' : 'movie');
                            
                            return (
                              <span className={`item-type ${itemType}`}>
                                {isAnime ? (t.anime || 'Аниме') : 
                                 item.media_type === 'tv' ? (t.tvSeries || 'Сериал') : 
                                 (t.movie || 'Фильм')}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="item-actions">
                        <a
                          href={getKinopoiskLink(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="item-link-btn"
                          title={t.onKinopoisk || 'На Кинопоиске'}
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button
                          className="item-remove-btn"
                          onClick={() => handleRemove(item.id, activeTab)}
                          title={t.removeFromList || 'Удалить из списка'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfile;
