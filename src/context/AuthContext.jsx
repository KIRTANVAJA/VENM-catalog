import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiRegister, apiLogout } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('venm_user') || localStorage.getItem('venm_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'
  const [authModalReason, setAuthModalReason] = useState('manual'); // 'manual' | 'initial_visit' | 'inquiry_required'

  // Pop up login once when visiting website if not logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyDismissed = sessionStorage.getItem('venm_login_popup_dismissed');
      const isUser = localStorage.getItem('venm_user') || localStorage.getItem('venm_admin_user');

      if (!isUser && !alreadyDismissed) {
        // Trigger welcoming pop-up 1.2s after page load
        const timer = setTimeout(() => {
          setAuthModalReason('initial_visit');
          setAuthModalTab('login');
          setIsAuthModalOpen(true);
        }, 1200);

        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = (e) => {
      if (e.detail !== undefined) {
        setCurrentUser(e.detail);
      } else {
        try {
          const stored = localStorage.getItem('venm_user') || localStorage.getItem('venm_admin_user');
          setCurrentUser(stored ? JSON.parse(stored) : null);
        } catch (err) {
          setCurrentUser(null);
        }
      }
    };

    window.addEventListener('venm-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('venm-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const login = async (username, password) => {
    const res = await apiLogin(username, password);
    if (res?.user) {
      setCurrentUser(res.user);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('venm_login_popup_dismissed', 'true');
      }
    }
    return res;
  };

  const register = async (userData) => {
    const res = await apiRegister(userData);
    if (res?.user) {
      setCurrentUser(res.user);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('venm_login_popup_dismissed', 'true');
      }
    }
    return res;
  };

  const logout = async () => {
    await apiLogout();
    setCurrentUser(null);
  };

  const openLoginModal = (tab = 'login', reason = 'manual') => {
    setAuthModalTab(tab);
    setAuthModalReason(reason);
    setIsAuthModalOpen(true);
  };

  const closeLoginModal = () => {
    if (typeof window !== 'undefined') {
      // Mark as dismissed for this session so it doesn't pop up again while browsing
      sessionStorage.setItem('venm_login_popup_dismissed', 'true');
    }
    setIsAuthModalOpen(false);
    setAuthModalReason('manual');
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'ADMIN',
    login,
    register,
    logout,
    isAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    authModalReason,
    openLoginModal,
    closeLoginModal
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
