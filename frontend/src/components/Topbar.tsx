import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
    onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="bg-white border-b border-secondary-200 h-16 fixed w-full top-0 z-30 lg:static lg:z-auto">
            <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 text-secondary-500 hover:text-secondary-900 hover:bg-secondary-50 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Search Bar (Optional) */}
                    <div className="hidden md:flex items-center relative">
                        <Search className="absolute left-3 text-secondary-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-9 pr-4 py-2 bg-secondary-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 w-64 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-danger-500 rounded-full border-2 border-white"></span>
                    </button>

                    <div className="h-8 w-px bg-secondary-200 mx-2"></div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-secondary-900">{user?.name}</p>
                            <p className="text-xs text-secondary-500 capitalize">{user?.role}</p>
                        </div>

                        <div className="relative group">
                            <button className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-transparent hover:ring-primary-100 transition-all">
                                <User size={20} className="text-primary-600" />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-secondary-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                                <div className="px-4 py-2 border-b border-secondary-50 sm:hidden">
                                    <p className="text-sm font-medium text-secondary-900">{user?.name}</p>
                                    <p className="text-xs text-secondary-500">{user?.role}</p>
                                </div>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2"
                                >
                                    <User size={16} />
                                    My Profile
                                </button>
                                <button
                                    onClick={() => navigate('/change-password')}
                                    className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2"
                                >
                                    <Settings size={16} />
                                    Change Password
                                </button>
                                <div className="border-t border-secondary-100 my-1"></div>
                                <button
                                    onClick={logout}
                                    className="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
                                >
                                    <LogOut size={16} />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
