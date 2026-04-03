import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { User, Edit2, X, Camera, Heart, Eye, Bookmark, ExternalLink, Trash2, Film, Tv } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useDraggablePosition } from '../hooks/useDraggablePosition';

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

const UserProfile = ({ t, isOpen, onClose }) => {
  const {
    profile,
    updateProfile,
    favorites,
    watched,
    watchlist,
    removeFromFavorites,
    removeFromWatched,
    removeFromWatchlist,
  } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name || '');
  const [activeTab, setActiveTab] = useState('favorites');
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragControls = useDragControls();
  const { position, savePosition } = useDraggablePosition('matriarch_profile_pos', isOpen);

  useEffect(() => {
    setEditName(profile.name || '');
  }, [profile.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
    if (!name) return '#6366f1';
    const colors = [
      '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e', '#ef4444', '#f97316',
      '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
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
    const type = item.media_type === 'tv' ? 'сериал' : 'фильм';
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
    switch (activeTab) {
      case 'favorites':
        return { items: favorites, label: t.favorites || 'Избранное', emptyMsg: t.favoritesEmpty || 'В избранном пока пусто' };
      case 'watched':
        return { items: watched, label: t.watched || 'Просмотренное', emptyMsg: t.watchedEmpty || 'Вы ещё ничего не посмотрели' };
      case 'watchlist':
        return { items: watchlist, label: t.watchlist || 'Буду смотреть', emptyMsg: t.watchlistEmpty || 'Список "Буду смотреть" пуст' };
      default:
        return { items: [], label: '', emptyMsg: '' };
    }
  };

  const currentList = getCurrentList();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="profile-panel"
          drag
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ left: -window.innerWidth + 420, right: window.innerWidth - 420, top: -window.innerHeight + 100, bottom: window.innerHeight - 100 }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            const newX = (position?.x || 0) + info.offset.x;
            const newY = (position?.y || 0) + info.offset.y;
            savePosition(newX, newY);
          }}
          initial={false}
          animate={position ? { x: position.x, y: position.y, opacity: 1 } : { x: 0, y: 0, opacity: 0 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{ position: 'fixed' }}
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
            <button className="filter-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="filter-content">
            {/* Секция профиля */}
            <div className="filter-section">
              <div className="profile-card">
                <div className={`profile-avatar-large ${profile.avatar ? 'has-avatar' : ''}`} style={{ background: profile.avatar ? 'transparent' : getAvatarColor(profile.name) }}>
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="avatar" className="profile-avatar-img" />
                  ) : (
                    <span className="profile-avatar-large-initials">{getInitials(profile.name)}</span>
                  )}
                  <button
                    className="profile-avatar-change"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={16} />
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
                <div className="profile-name-section">
                  {isEditing ? (
                    <div className="profile-name-edit">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t.profileName || 'Имя'}
                        maxLength={30}
                        className="styled-select profile-name-input"
                      />
                      <div className="edit-actions-row">
                        <button className="edit-save-btn" onClick={handleSave}>
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="edit-cancel-btn"
                          onClick={() => {
                            setEditName(profile.name || '');
                            setIsEditing(false);
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="profile-name-view">
                      <span className="profile-name-display" onClick={() => setIsEditing(true)}>
                        {profile.name || (t.profileNamePlaceholder || 'Ваше имя')}
                      </span>
                      <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="profile-stats-row">
                  <div className="profile-stat-item">
                    <Heart size={16} />
                    <span>{favorites.length}</span>
                  </div>
                  <div className="profile-stat-item">
                    <Eye size={16} />
                    <span>{watched.length}</span>
                  </div>
                  <div className="profile-stat-item">
                    <Bookmark size={16} />
                    <span>{watchlist.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Вкладки */}
            <div className="filter-section">
              <label className="filter-label">Списки</label>
              <div className="profile-tabs-row">
                <button
                  className={`profile-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                  onClick={() => setActiveTab('favorites')}
                >
                  <Heart size={14} />
                  <span>{t.favorites || 'Избранное'}</span>
                  {favorites.length > 0 && <span className="tab-badge">{favorites.length}</span>}
                </button>
                <button
                  className={`profile-tab-btn ${activeTab === 'watched' ? 'active' : ''}`}
                  onClick={() => setActiveTab('watched')}
                >
                  <Eye size={14} />
                  <span>{t.watched || 'Просмотренное'}</span>
                  {watched.length > 0 && <span className="tab-badge">{watched.length}</span>}
                </button>
                <button
                  className={`profile-tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
                  onClick={() => setActiveTab('watchlist')}
                >
                  <Bookmark size={14} />
                  <span>{t.watchlist || 'Буду смотреть'}</span>
                  {watchlist.length > 0 && <span className="tab-badge">{watchlist.length}</span>}
                </button>
              </div>
            </div>

            {/* Список фильмов */}
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
                          <span className={`item-type ${item.media_type === 'tv' ? 'tv' : 'movie'}`}>
                            {item.media_type === 'tv' ? (t.tvSeries || 'Сериал') : (t.movie || 'Фильм')}
                          </span>
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserProfile;
