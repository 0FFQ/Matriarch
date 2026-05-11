import { IMAGE_BASE } from '../constants';


export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `${IMAGE_BASE.replace('w500', size)}${path}`;
};


export const getPosterUrl = (item, size = 'w500') => {
  if (!item || !item.poster_path) return null;
  return getImageUrl(item.poster_path, size);
};


export const PosterPlaceholder = ({ mediaType, label, className = '' }) => {
  const isTV = mediaType === 'tv';
  
  return (
    <div className={`poster-placeholder ${className}`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        width="64" 
        height="64"
        aria-hidden="true"
      >
        {isTV ? (
          <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
        ) : (
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
        )}
      </svg>
      {label && <span className="placeholder-label">{label}</span>}
    </div>
  );
};

export default {
  getImageUrl,
  getPosterUrl,
  PosterPlaceholder
};
