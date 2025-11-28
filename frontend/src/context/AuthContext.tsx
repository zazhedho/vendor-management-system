import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api/axios';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    role_id?: string;
    permissions?: string[];
    created_at?: string;
    updated_at?: string;
}

interface UpdateProfileData {
    name: string;
    email: string;
    phone: string;
}

interface UpdatePasswordData {
    currentPassword: string;
    newPassword: string;
}

interface AuthResult {
    success: boolean;
    error?: string;
    data?: any;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateProfile: (data: UpdateProfileData) => Promise<AuthResult>;
    updatePassword: (data: UpdatePasswordData) => Promise<AuthResult>;
    deleteUser: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    // Verify token and get user info
                    const response = await api.get('/api/user');
                    setUser(response.data.data); // Adjust based on actual API response structure
                    setToken(storedToken);
                } catch (error) {
                    console.error('Failed to fetch user', error);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        setIsLoading(false);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        // Optional: Call logout API
        api.post('/api/user/logout').catch(() => { });
    };

    const updateProfile = async (data: UpdateProfileData): Promise<AuthResult> => {
        try {
            const response = await api.put('/api/user', data);
            setUser(response.data.data);
            return { success: true, data: response.data };
        } catch (error: any) {
            let errorMessage = 'Update failed';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error?.message) {
                errorMessage = error.response.data.error.message;
            }
            return { success: false, error: errorMessage };
        }
    };

    const updatePassword = async (data: UpdatePasswordData): Promise<AuthResult> => {
        try {
            await api.put('/api/user/change-password', {
                current_password: data.currentPassword,
                new_password: data.newPassword,
            });
            await logout();
            return { success: true };
        } catch (error: any) {
            let errorMessage = 'Password update failed';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error?.message) {
                errorMessage = error.response.data.error.message;
            }
            return { success: false, error: errorMessage };
        }
    };

    const deleteUser = async (): Promise<AuthResult> => {
        try {
            await api.delete('/api/user');
            await logout();
            return { success: true };
        } catch (error: any) {
            let errorMessage = 'Failed to delete account';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error?.message) {
                errorMessage = error.response.data.error.message;
            }
            return { success: false, error: errorMessage };
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout, updateProfile, updatePassword, deleteUser }}>
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
