import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from './authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getUser());
  const [token, setToken] = useState(authService.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = authService.getToken();
    if (storedToken) {
      authService.fetchProfile()
        .then(profile => {
          if (profile) {
            setUser(profile);
            localStorage.setItem('smart_user', JSON.stringify(profile));
          }
        })
        .catch(() => {
          authService.logout();
          setUser(null);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { token: newToken, user: newUser } = await authService.login(email, password);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (fullName, email, password, phone, role) => {
    const { token: newToken, user: newUser } = await authService.register(fullName, email, password, phone, role);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
