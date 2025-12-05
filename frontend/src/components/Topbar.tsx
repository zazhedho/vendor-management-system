import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, LogOut, User, Settings, Monitor, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eventsApi } from '../api/events';
import { vendorsApi } from '../api/vendors';
import { paymentsApi } from '../api/payments';
import { toast } from 'react-toastify';

interface TopbarProps {
    onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
    const { user, logout, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement | null>(null);
    const debounceRef = useRef<number | null>(null);
    // Notification polling is disabled for now
    const [newEventCount] = useState(0);
    const [latestOpenEvent] = useState<any>(null);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const notifRef = useRef<HTMLDivElement | null>(null);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }
        if (!value.trim()) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }
        debounceRef.current = window.setTimeout(() => {
            performSearch(value.trim());
        }, 1000);
    };

    const performSearch = async (query: string) => {
        setIsSearching(true);
        try {
            const canSearchVendors =
                hasPermission('vendor', 'view') &&
                (hasPermission('vendor', 'update_status') || hasPermission('event', 'select_winner'));
            const canSearchEvents = hasPermission('event', 'view');
            const canSearchPayments = hasPermission('payment', 'view');

            const [vendorsRes, eventsRes, paymentsRes] = await Promise.all([
                canSearchVendors ? vendorsApi.getAll({ search: query, limit: 5 }).catch(() => null) : Promise.resolve(null),
                canSearchEvents ? eventsApi.getAll({ search: query, limit: 5 }).catch(() => null) : Promise.resolve(null),
                canSearchPayments && paymentsApi.getAll ? paymentsApi.getAll({ search: query, limit: 5 }).catch(() => null) : Promise.resolve(null),
            ]);

            const results: any[] = [];
            if (vendorsRes?.data) {
                results.push(
                    ...(vendorsRes.data || []).map((item: any) => ({
                        type: 'vendor',
                        typeLabel: `Vendor • ${item.vendor?.vendor_code || item.vendor?.id || item.id || ''}`,
                        title: item.profile?.vendor_name || item.vendor?.profile?.vendor_name || item.vendor?.id || 'Vendor',
                        navigateTo: item.vendor?.id ? `/vendors/${item.vendor.id}` : undefined,
                    }))
                );
            }
            if (eventsRes?.data) {
                results.push(
                    ...(eventsRes.data || []).map((event: any) => ({
                        type: 'event',
                        typeLabel: 'Event',
                        title: event.title || event.name || 'Event',
                        navigateTo: event.id ? `/events/${event.id}` : undefined,
                    }))
                );
            }
            if (paymentsRes?.data) {
                results.push(
                    ...(paymentsRes.data || []).map((payment: any) => ({
                        type: 'payment',
                        typeLabel: 'Payment',
                        title: payment.invoice_number || 'Payment',
                        navigateTo: payment.id ? `/payments/${payment.id}` : undefined,
                    }))
                );
            }

            setSearchResults(results);
            setShowSearchDropdown(true);
        } catch (error) {
            console.error('Global search failed:', error);
            toast.error('Search failed');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchSelect = (item: any) => {
        if (item.navigateTo) {
            navigate(item.navigateTo);
        }
        setShowSearchDropdown(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSearchDropdown(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Notification polling disabled; stub functions to keep handlers intact
    const markEventsSeen = () => {};

    useEffect(() => {}, [hasPermission, user?.id]);

    return (
        <header className="bg-white border-b border-secondary-200 h-16 sticky top-0 z-30 lg:static lg:z-auto">
            <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 text-secondary-500 hover:text-secondary-900 hover:bg-secondary-50 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Search Bar (Optional) */}
                    <div className="hidden md:flex items-center relative" ref={searchRef}>
                        <Search className="absolute left-3 text-secondary-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search vendors, events, payments..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                            className="pl-9 pr-4 py-2 bg-secondary-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 w-64 transition-all"
                        />
                        {showSearchDropdown && (
                            <div className="absolute top-full mt-2 w-80 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                                {isSearching ? (
                                    <div className="flex items-center justify-center py-4 text-secondary-500">
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Searching...
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="py-4 text-center text-sm text-secondary-500">No results found</div>
                                ) : (
                                    <ul className="divide-y divide-secondary-100">
                                        {searchResults.map((item, idx) => (
                                            <li
                                                key={`${item.type}-${idx}`}
                                                className="px-4 py-3 hover:bg-secondary-50 cursor-pointer"
                                                onClick={() => handleSearchSelect(item)}
                                            >
                                                <p className="text-sm font-semibold text-secondary-900">{item.title}</p>
                                                <p className="text-xs text-secondary-500">{item.typeLabel}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="relative" ref={notifRef}>
                        <button
                            className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors relative"
                            onClick={() => setShowNotifDropdown((prev) => !prev)}
                            aria-label="Notifications"
                        >
                            <Bell size={20} />
                            {newEventCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-danger-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">
                                    {newEventCount}
                                </span>
                            )}
                        </button>
                        {showNotifDropdown && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-secondary-100 py-2 z-50">
                                <div className="px-4 pb-2 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-secondary-900">Notifikasi</p>
                                    <button
                                        className="text-xs text-primary-600 hover:underline"
                                        onClick={() => {
                                            markEventsSeen();
                                            setShowNotifDropdown(false);
                                        }}
                                    >
                                        Tandai sudah dibaca
                                    </button>
                                </div>
                                {latestOpenEvent ? (
                                    <button
                                        className="w-full text-left px-4 py-3 hover:bg-secondary-50 transition flex items-start gap-3"
                                        onClick={() => {
                                            markEventsSeen();
                                            setShowNotifDropdown(false);
                                            if (latestOpenEvent.id) {
                                                navigate(`/events/${latestOpenEvent.id}`);
                                            }
                                        }}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                                            <Bell size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-secondary-900">
                                                Event baru: {latestOpenEvent.title || (latestOpenEvent as any).name || 'Event'}
                                            </p>
                                            <p className="text-xs text-secondary-600">
                                                Status: {latestOpenEvent.status || 'open'}
                                            </p>
                                        </div>
                                    </button>
                                ) : (
                                    <p className="text-sm text-secondary-500 px-4 py-3">Belum ada notifikasi.</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="h-8 w-px bg-secondary-200 mx-2"></div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-secondary-900">{user?.name}</p>
                            <p className="text-xs text-secondary-500 capitalize">{user?.role}</p>
                        </div>

                        <div className="relative" ref={menuRef}>
                            <button
                                className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-transparent hover:ring-primary-100 transition-all"
                                onClick={() => setShowUserMenu((prev) => !prev)}
                                aria-haspopup="true"
                                aria-expanded={showUserMenu}
                            >
                                <User size={20} className="text-primary-600" />
                            </button>

                            {/* Dropdown Menu */}
                            <div
                                className={`absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-secondary-100 py-1 transition-all duration-200 transform origin-top-right z-50 ${
                                    showUserMenu ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
                                }`}
                            >
                                <div className="px-4 py-2 border-b border-secondary-50 sm:hidden">
                                    <p className="text-sm font-medium text-secondary-900">{user?.name}</p>
                                    <p className="text-xs text-secondary-500">{user?.role}</p>
                                </div>
                                <button
                                    onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2"
                                >
                                    <User size={16} />
                                    My Profile
                                </button>
                                <button
                                    onClick={() => { navigate('/change-password'); setShowUserMenu(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2"
                                >
                                    <Settings size={16} />
                                    Change Password
                                </button>
                                <button
                                    onClick={() => { navigate('/sessions'); setShowUserMenu(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2"
                                >
                                    <Monitor size={16} />
                                    Active Sessions
                                </button>
                                <div className="border-t border-secondary-100 my-1"></div>
                                <button
                                    onClick={() => { setShowUserMenu(false); logout(); }}
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
