import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, User, CheckCircle, Info } from 'lucide-react';
import { signInWithGoogle, logout, onAuthChange } from '../firebase/auth';
import { useUser } from '../context/UserContext';

const AuthButton = () => {
  const { updateProfile } = useUser();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Обновляем профиль из Firebase
      if (firebaseUser) {
        updateProfile({
          name: firebaseUser.displayName || '',
          avatar: firebaseUser.photoURL || '',
          email: firebaseUser.email || ''
        });
      }
    });

    return () => unsubscribe();
  }, [updateProfile]);

  const handleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (!result) {
        console.log('[Auth] Sign in cancelled');
      }
    } catch (error) {
      console.error('Sign in failed:', error.message);
      alert('Ошибка входа: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
        Проверка авторизации...
      </div>
    );
  }

  // Авторизован
  if (user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={18} color="white" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user.displayName || user.email}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '2px'
            }}>
              <CheckCircle size={12} />
              Синхронизация включена
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <LogIn size={16} />
          Выйти
        </motion.button>
      </motion.div>
    );
  }

  // Не авторизован
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSignIn}
        style={{
          width: '100%',
          padding: '12px',
          background: '#ffffff',
          color: '#333333',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Войти через Google
      </motion.button>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 10px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#60a5fa'
      }}>
        <Info size={14} />
        <span>Данные будут синхронизироваться между устройствами</span>
      </div>
    </motion.div>
  );
};

export default AuthButton;
