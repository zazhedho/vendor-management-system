import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Menu } from '../types';
import { authApi } from '../api/auth';
import { menusApi } from '../api/menus';
import { permissionsApi } from '../api/permissions';

interface AuthContextType {
  user: User | null;
  token: string | null;
  userMenus: Menu[];
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (userData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  updatePassword: (passwordData: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteUser: () => Promise<{ success: boolean; error?: string }>;
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
    try {
      const response = await authApi.login({ email, password });

      if (response.status && response.data?.token) {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);

        const profileResponse = await authApi.getProfile();
        if (profileResponse.status && profileResponse.data) {
          setUser(profileResponse.data);
          localStorage.setItem('user', JSON.stringify(profileResponse.data));

          try {
            // Fetch menus using the correct endpoint
            const menusResponse = await menusApi.getMyMenus();
            if (menusResponse.status && menusResponse.data) {
              setUserMenus(menusResponse.data);
              localStorage.setItem('userMenus', JSON.stringify(menusResponse.data));
            }

            // Fetch permissions using the correct endpoint
            try {
              const permissionsResponse = await permissionsApi.getMyPermissions();
              if (permissionsResponse.status && permissionsResponse.data) {
                const permissionNames = permissionsResponse.data.map(p => p.name);
                setUser(prev => prev ? { ...prev, permissions: permissionNames } : null);

                // Update local storage as well to persist permissions
                const updatedUser = { ...profileResponse.data, permissions: permissionNames };
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
            } catch (error) {
              console.error('Failed to fetch user permissions:', error);
            }
          } catch (error) {
            console.error('Failed to fetch user data:', error);
          }

          return { success: true, user: profileResponse.data };
        }
      }

      const errorMessage = response.message || 'Login failed';
      return { success: false, error: errorMessage };
    } catch (error: any) {
      let errorMessage = 'Login failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (Array.isArray(error.response?.data?.error) && error.response.data.error.length > 0) {
        errorMessage = error.response.data.error.map((err: any) => err.message).join(', ');
      }
      return { success: false, error: errorMessage };
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

  const register = async (userData: any) => {
    try {
      const response = await authApi.register(userData);
      return { success: true, data: response };
    } catch (error: any) {
      let errorMessage = 'Registration failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (Array.isArray(error.response?.data?.error) && error.response.data.error.length > 0) {
        errorMessage = error.response.data.error.map((err: any) => err.message).join(', ');
      }
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (userData: any) => {
    try {
      const response = await authApi.updateProfile(userData);
      if (response.status && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return { success: true, data: response };
      }
      return { success: false, error: response.message || 'Update failed' };
    } catch (error: any) {
      let errorMessage = 'Update failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (Array.isArray(error.response?.data?.error) && error.response.data.error.length > 0) {
        errorMessage = error.response.data.error.map((err: any) => err.message).join(', ');
      }
      return { success: false, error: errorMessage };
    }
  };

  const updatePassword = async (passwordData: { currentPassword: string; newPassword: string }) => {
    try {
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      await logout();
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'Password update failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (Array.isArray(error.response?.data?.error) && error.response.data.error.length > 0) {
        errorMessage = error.response.data.error.map((err: any) => err.message).join(', ');
      }
      return { success: false, error: errorMessage };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await authApi.forgotPassword(email);
      return { success: true, data: response };
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (Array.isArray(error.response?.data?.error) && error.response.data.error.length > 0) {
        errorMessage = error.response.data.error.map((err: any) => err.message).join(', ');
      }
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await authApi.resetPassword(token, newPassword);
      return { success: true, data: response };
    } catch (error: any) {
      let errorMessage = 'Failed to reset password';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (Array.isArray(error.response?.data?.error) && error.response.data.error.length > 0) {
        errorMessage = error.response.data.error.map((err: any) => err.message).join(', ');
      }
      return { success: false, error: errorMessage };
    }
  };

  const deleteUser = async () => {
    try {
      await authApi.deleteUser();
      await logout();
      return { success: true };
    } catch (error: any) {
      let errorMessage = 'Failed to delete account';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (Array.isArray(error.response?.data?.error) && error.response.data.error.length > 0) {
        errorMessage = error.response.data.error.map((err: any) => err.message).join(', ');
      }
      return { success: false, error: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        userMenus,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        forgotPassword,
        resetPassword,
        deleteUser,
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
