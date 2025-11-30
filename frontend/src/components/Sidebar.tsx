import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Calendar,
    Users,
    CreditCard,
    Star,
    ShoppingBag,
    Shield,
    List as ListIcon,
    X,
    LayoutDashboard,
    FileText,
    Settings,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Circle,
    PanelLeftClose,
    PanelLeft
} from 'lucide-react';
import { MenuItem } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    menuItems: MenuItem[];
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, menuItems, isCollapsed, onToggleCollapse }) => {
    const location = useLocation();
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
    const [userToggledMenus, setUserToggledMenus] = useState<Record<string, boolean>>({});

    // Map Bootstrap Icons (from API) to Lucide icons
    const iconMap: Record<string, typeof Home> = {
        // Lucide names (fallback)
        Home,
        Calendar,
        Users,
        CreditCard,
        Star,
        ShoppingBag,
        Shield,
        List: ListIcon,
        LayoutDashboard,
        FileText,
        Settings,
        Circle,
        // Bootstrap icon mappings (bi-*)
        'bi-speedometer2': LayoutDashboard,
        'bi-person-circle': Users,
        'bi-building': ShoppingBag,
        'bi-file-earmark-text': FileText,
        'bi-calendar-event': Calendar,
        'bi-star': Star,
        'bi-credit-card': CreditCard,
        'bi-people': Users,
        'bi-shield-lock': Shield,
        'bi-list-ul': ListIcon,
    };

    const isMenuActive = (item: MenuItem): boolean => {
        const currentPath = location.pathname;

        // Exact match
        if (currentPath === item.path) return true;

        // Check if any child is active
        if (item.children && item.children.length > 0) {
            return item.children.some(child =>
                currentPath === child.path || (child.path && currentPath.startsWith(child.path + '/'))
            );
        }

        // For parent routes with UUID patterns
        if (item.path) {
            const baseRoute = item.path.split('/')[1];
            if (baseRoute) {
                return currentPath === `/${baseRoute}/new` ||
                    currentPath.match(new RegExp(`^/${baseRoute}/[a-f0-9-]{36}`)) !== null;
            }
        }

        return false;
    };

    const toggleSubmenu = (menuName: string) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuName]: !prev[menuName]
        }));
        setUserToggledMenus(prev => ({
            ...prev,
            [menuName]: true
        }));
    };

    const renderMenuItem = (item: MenuItem) => {
        const hasChildren = item.children && item.children.length > 0;
        const isActive = isMenuActive(item);
        const IconComponent = iconMap[item.icon] || Home;

        // Determine if menu should be expanded
        let isExpanded = false;
        if (hasChildren) {
            const hasActiveChild = item.children.some(child => isMenuActive(child));
            if (userToggledMenus[item.name]) {
                isExpanded = expandedMenus[item.name];
            } else {
                isExpanded = hasActiveChild;
            }
        }

        if (hasChildren) {
            return (
                <li key={item.name}>
                    <button
                        onClick={() => toggleSubmenu(item.name)}
                        className={`
                            w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
                            ${isActive
                                ? 'bg-primary-600/20 text-primary-400'
                                : 'text-secondary-400 hover:bg-secondary-800 hover:text-white'
                            }
                        `}
                    >
                        <div className="flex items-center space-x-3">
                            <IconComponent size={20} className={isActive ? 'text-primary-400' : 'text-secondary-400'} />
                            <span className="font-medium">{item.label}</span>
                        </div>
                        {isExpanded ? (
                            <ChevronDown size={16} className="text-secondary-400" />
                        ) : (
                            <ChevronRight size={16} className="text-secondary-400" />
                        )}
                    </button>
                    {isExpanded && (
                        <ul className="mt-1 ml-4 space-y-1 border-l border-secondary-700 pl-4">
                            {item.children.map(child => {
                                const ChildIcon = iconMap[child.icon] || Circle;
                                const childActive = isMenuActive(child);

                                return (
                                    <li key={child.path || child.name}>
                                        <Link
                                            to={child.path || '#'}
                                            onClick={onClose}
                                            className={`
                                                flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200
                                                ${childActive
                                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                                                    : 'text-secondary-400 hover:bg-secondary-800 hover:text-white'
                                                }
                                            `}
                                        >
                                            <ChildIcon size={16} className={childActive ? 'text-white' : 'text-secondary-400'} />
                                            <span className="font-medium text-sm">{child.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </li>
            );
        }

        return (
            <li key={item.path || item.name}>
                <Link
                    to={item.path || '#'}
                    onClick={onClose}
                    className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${isActive
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                            : 'text-secondary-400 hover:bg-secondary-800 hover:text-white'
                        }
                    `}
                >
                    <IconComponent size={20} className={isActive ? 'text-white' : 'text-secondary-400'} />
                    <span className="font-medium">{item.label}</span>
                </Link>
            </li>
        );
    };

    const renderCollapsedMenuItem = (item: MenuItem) => {
        const isActive = isMenuActive(item);
        const IconComponent = iconMap[item.icon] || Home;

        return (
            <li key={item.path || item.name} className="relative group">
                <Link
                    to={item.path || '#'}
                    onClick={onClose}
                    className={`
                        flex items-center justify-center p-3 rounded-lg transition-all duration-200
                        ${isActive
                            ? 'bg-primary-600 text-white'
                            : 'text-secondary-400 hover:bg-secondary-800 hover:text-white'
                        }
                    `}
                >
                    <IconComponent size={20} />
                </Link>
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-secondary-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.label}
                </div>
            </li>
        );
    };

    return (
        <>
            <aside
                className={`
                    fixed inset-y-0 left-0 z-40 bg-secondary-900 text-white transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-16' : 'w-64'}
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                `}
            >
                {/* Header */}
                <div className={`flex items-center justify-between bg-secondary-950 ${isCollapsed ? 'px-2 py-4' : 'px-4 py-5'}`}>
                    {isCollapsed ? (
                        <div className="flex flex-col items-center flex-1">
                            <img src="/logo-vms.png" alt="VMS Logo" className="w-10 h-10" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center flex-1">
                            <img src="/logo-vms.png" alt="VMS Logo" className="w-16 h-16 mb-3" />
                            <div className="text-center">
                                <p className="text-lg font-bold tracking-wide text-white">Vendor</p>
                                <p className="text-sm font-medium tracking-wide text-secondary-400">Management System</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="lg:hidden text-secondary-400 hover:text-white transition-colors absolute top-4 right-4"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className={`h-[calc(100vh-6rem)] overflow-y-auto py-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                    <ul className="space-y-1">
                        {isCollapsed 
                            ? menuItems.map(item => renderCollapsedMenuItem(item))
                            : menuItems.map(item => renderMenuItem(item))
                        }
                    </ul>
                </nav>

                {/* Collapse Toggle Button - Desktop Only */}
                <div className="hidden lg:flex absolute bottom-4 left-0 right-0 justify-center px-3">
                    <button
                        onClick={onToggleCollapse}
                        className="flex items-center justify-center w-full p-2 rounded-lg bg-secondary-800 hover:bg-secondary-700 text-secondary-400 hover:text-white transition-colors"
                    >
                        {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                        {!isCollapsed && <span className="ml-2 text-sm">Collapse</span>}
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={onClose}
                />
            )}
        </>
    );
};
