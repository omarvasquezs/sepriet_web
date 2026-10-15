import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

export interface User {
  id: number;
  name: string;
  username: string;
  email?: string;
  role_id?: number;
  role: string;
  permisos?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthTransitioning: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthTransitioning, setIsAuthTransitioning] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const roleUpper = (user.role || '').toUpperCase();
    if (user.role_id === 1 || roleUpper.includes('ADMIN')) {
      return true;
    }
    if (!user.permisos || !Array.isArray(user.permisos)) {
      return false;
    }
    return user.permisos.includes(permission);
  };

  const login = (newToken: string, newUser: User) => {
    setIsAuthTransitioning(true);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setTimeout(() => {
      setIsAuthTransitioning(false);
    }, 250);
  };

  const logout = () => {
    setIsAuthTransitioning(true);
    if (token) {
      api.post('/auth/logout').catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setTimeout(() => {
      setIsAuthTransitioning(false);
    }, 250);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAuthTransitioning, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
