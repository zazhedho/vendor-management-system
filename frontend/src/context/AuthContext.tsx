import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Menu } from '../types';
import { authApi } from '../api/auth';
import { menusApi } from '../api/menus';

interface AuthContextType {
  user: User | null;
  token: string | null;
  userMenus: Menu[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userMenus, setUserMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedMenus = localStorage.getItem('userMenus');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedMenus) {
        setUserMenus(JSON.parse(storedMenus));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });

    if (response.status && response.data?.token) {
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);

      const profileResponse = await authApi.getProfile();
      if (profileResponse.status && profileResponse.data) {
        setUser(profileResponse.data);
        localStorage.setItem('user', JSON.stringify(profileResponse.data));

        try {
          const menusResponse = await menusApi.getMyMenus();
          if (menusResponse.status && menusResponse.data) {
            setUserMenus(menusResponse.data);
            localStorage.setItem('userMenus', JSON.stringify(menusResponse.data));
          }
        } catch (error) {
          console.error('Failed to fetch user menus:', error);
        }
      }
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setUserMenus([]);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userMenus');
    }
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        userMenus,
        login,
        logout,
        isLoading,
        isAuthenticated: !!token && !!user,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
