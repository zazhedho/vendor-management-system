import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import menuService from '../../services/menuService';
import type { MenuItem, APIMenu } from '../../types/menu';

// Helper function to build hierarchical menu structure
const buildMenuHierarchy = (flatMenus: MenuItem[]): MenuItem[] => {
  const menuMap: { [key: string]: MenuItem } = {};
  const rootMenus: MenuItem[] = [];

  // First pass: create a map of all menus
  flatMenus.forEach(menu => {
    menuMap[menu.id || menu.name] = { ...menu, children: [] };
  });

  // Second pass: build hierarchy
  flatMenus.forEach(menu => {
    const menuItem = menuMap[menu.id || menu.name];
    if (menu.parentId && menuMap[menu.parentId]) {
      menuMap[menu.parentId].children!.push(menuItem);
    } else if (!menu.parentId) {
      rootMenus.push(menuItem);
    }
  });

  // Sort by orderIndex
  const sortMenus = (menus: MenuItem[]): MenuItem[] => {
    menus.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    menus.forEach(menu => {
      if (menu.children && menu.children.length > 0) {
        sortMenus(menu.children);
      }
    });
    return menus;
  };

  return sortMenus(rootMenus);
};

interface SidebarProps {
    onCloseMobileMenu?: () => void;
    isCollapsed?: boolean;
}

const Sidebar = ({ onCloseMobileMenu, isCollapsed = false }: SidebarProps) => {
    const { user } = useAuth();
    const location = useLocation();
    const role = user?.role || '';
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
    const [userToggledMenus, setUserToggledMenus] = useState<{ [key: string]: boolean }>({});
    const menuLoadedRef = useRef(false);

    // Fallback menus based on role (vendor-management specific)
    const getFallbackMenus = (role: string): MenuItem[] => {
        const baseMenus: MenuItem[] = [
            { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2', name: 'dashboard', children: [] },
        ];

        if (role === 'vendor') {
            return [
                ...baseMenus,
                { path: '/events', label: 'Events', icon: 'bi-calendar-event', name: 'events', children: [] },
                { path: '/evaluations', label: 'Evaluations', icon: 'bi-star', name: 'evaluations', children: [] },
                { path: '/payments', label: 'Payments', icon: 'bi-credit-card', name: 'payments', children: [] },
            ];
        }

        if (role === 'client') {
            return [
                ...baseMenus,
                { path: '/events', label: 'Events', icon: 'bi-calendar-event', name: 'events', children: [] },
                { path: '/evaluations', label: 'Evaluations', icon: 'bi-star', name: 'evaluations', children: [] },
            ];
        }

        if (role === 'admin' || role === 'superadmin') {
            return [
                ...baseMenus,
                { path: '/vendors', label: 'Vendors', icon: 'bi-building', name: 'vendors', children: [] },
                { path: '/events', label: 'Events', icon: 'bi-calendar-event', name: 'events', children: [] },
                { path: '/evaluations', label: 'Evaluations', icon: 'bi-star', name: 'evaluations', children: [] },
                { path: '/payments', label: 'Payments', icon: 'bi-credit-card', name: 'payments', children: [] },
                { path: '/users', label: 'Users', icon: 'bi-people', name: 'users', children: [] },
                { path: '/roles', label: 'Roles', icon: 'bi-shield-lock', name: 'roles', children: [] },
                { path: '/menus', label: 'Menus', icon: 'bi-list-ul', name: 'menus', children: [] },
            ];
        }

        return baseMenus;
    };

    // Reset menu loaded ref when user changes (e.g., logout/login)
    useEffect(() => {
        if (!user) {
            menuLoadedRef.current = false;
            setMenuItems([]);
        }
    }, [user]);

    // Fetch user menus - only once when user is available
    useEffect(() => {
        const fetchMenus = async () => {
            // Skip if already loaded
            if (menuLoadedRef.current) {
                return;
            }

            try {
                console.log('Fetching menus for user:', user);
                const response = await menuService.getUserMenus();
                console.log('Menus response:', response);
                const menus: APIMenu[] = response.data.data || [];

                if (menus.length === 0) {
                    console.warn('No menus returned from API, using fallback based on role');
                    const fallbackMenus = getFallbackMenus(role);
                    setMenuItems(fallbackMenus);
                    menuLoadedRef.current = true;
                    return;
                }

                // Transform API menu format to component format with hierarchy support
                // Filter out profile menu - accessible only via navbar dropdown
                const transformedMenus: MenuItem[] = menus
                    .filter(menu => menu.name !== 'profile' && menu.path !== '/profile')
                    .map(menu => ({
                        id: menu.id,
                        path: menu.path,
                        label: menu.display_name,
                        icon: menu.icon || 'home',
                        name: menu.name,
                        parentId: menu.parent_id || null,
                        orderIndex: menu.order_index || 0,
                    }));

                // Build hierarchical menu structure
                const hierarchicalMenus = buildMenuHierarchy(transformedMenus);
                console.log('Hierarchical menus:', hierarchicalMenus);
                setMenuItems(hierarchicalMenus);
                menuLoadedRef.current = true;
            } catch (error) {
                console.error('Failed to fetch menus:', error);
                // Fallback to role-based menu if API fails
                const fallbackMenus = getFallbackMenus(role);
                console.log('Using fallback menus:', fallbackMenus);
                setMenuItems(fallbackMenus);
                menuLoadedRef.current = true;
            }
        };

        if (user && !menuLoadedRef.current) {
            fetchMenus();
        }
    }, [user, role]);

    const toggleSubmenu = (menuName: string) => {
        setExpandedMenus(prev => {
            const newState = !prev[menuName];
            return {
                ...prev,
                [menuName]: newState
            };
        });
        // Mark that user has manually toggled this menu
        setUserToggledMenus(prev => ({
            ...prev,
            [menuName]: true
        }));
    };

    const isMenuActive = (item: MenuItem): boolean => {
        const currentPath = location.pathname;

        // Exact match
        if (currentPath === item.path) return true;

        // Check if any child is active
        if (item.children && item.children.length > 0) {
            return item.children.some(child =>
                currentPath === child.path ||
                (child.path && currentPath.startsWith(child.path + '/'))
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

    const renderMenuItem = (item: MenuItem) => {
        const hasChildren = item.children && item.children.length > 0;
        const isActive = isMenuActive(item);
        const iconClass = item.icon || 'bi-circle';

        // Determine if menu should be expanded
        let isExpanded = false;
        if (hasChildren && !isCollapsed) {
            const hasActiveChild = item.children!.some(child => isMenuActive(child));
            // If user has manually toggled, respect their choice
            // Otherwise, auto-expand if child is active
            if (userToggledMenus[item.name]) {
                isExpanded = expandedMenus[item.name];
            } else {
                isExpanded = hasActiveChild;
            }
        }

        if (hasChildren) {
            return (
                <div key={item.name} className="mb-1">
                    <div
                        className={`d-flex align-items-center gap-3 px-3 py-3 rounded text-secondary cursor-pointer ${isActive ? 'bg-primary bg-opacity-10 text-primary' : ''}`}
                        onClick={() => !isCollapsed && toggleSubmenu(item.name)}
                        style={{
                            cursor: isCollapsed ? 'default' : 'pointer',
                            justifyContent: isCollapsed ? 'center' : 'flex-start'
                        }}
                        title={isCollapsed ? item.label : ''}
                    >
                        <i className={`bi ${iconClass}`} style={{ fontSize: '1.1rem' }}></i>
                        {!isCollapsed && (
                            <>
                                <span className="fw-medium flex-grow-1">{item.label}</span>
                                <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} style={{ fontSize: '0.85rem' }}></i>
                            </>
                        )}
                    </div>
                    {isExpanded && !isCollapsed && (
                        <div className="ms-3 mt-1">
                            {item.children!.map(child => {
                                const childIconClass = child.icon || 'bi-circle';
                                const isChildActive = isMenuActive(child);
                                return (
                                    <NavLink
                                        to={child.path || '#'}
                                        key={child.path}
                                        className={`d-flex align-items-center gap-3 px-3 py-2 rounded mb-1 text-decoration-none ${isChildActive ? 'bg-primary bg-opacity-10 text-primary' : 'text-secondary'}`}
                                        onClick={onCloseMobileMenu}
                                    >
                                        <i className={`bi ${childIconClass}`} style={{ fontSize: '1rem' }}></i>
                                        <span className="fw-medium">{child.label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <NavLink
                to={item.path || '#'}
                key={item.path}
                className={`d-flex align-items-center gap-3 px-3 py-3 rounded mb-1 text-decoration-none ${isActive ? 'bg-primary bg-opacity-10 text-primary' : 'text-secondary'}`}
                onClick={onCloseMobileMenu}
                style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                title={isCollapsed ? item.label : ''}
            >
                <i className={`bi ${iconClass}`} style={{ fontSize: '1.1rem' }}></i>
                {!isCollapsed && <span className="fw-medium">{item.label}</span>}
            </NavLink>
        );
    };

    return (
        <div className="sidebar d-flex flex-column h-100">
            {/* Sidebar Header */}
            <div className={`${isCollapsed ? 'p-2' : 'p-4'}`} style={{
                borderBottom: '1px solid rgba(79, 70, 229, 0.15)',
                transition: 'all 0.3s ease'
            }}>
                <div className="text-center">
                    {isCollapsed ? (
                        <h3 className="fw-bold m-0" style={{
                            color: 'var(--primary-color-dark)',
                            fontSize: '1.2rem',
                            letterSpacing: '0'
                        }}>V</h3>
                    ) : (
                        <>
                            <h3 className="fw-bold m-0 mb-1" style={{
                                color: 'var(--primary-color-dark)',
                                fontSize: '1.5rem',
                                letterSpacing: '-0.5px'
                            }}>VMS</h3>
                            <small className="text-muted d-block" style={{
                                fontSize: '0.75rem',
                                letterSpacing: '0.5px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                Vendor Management
                            </small>
                        </>
                    )}
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex-grow-1 p-2" style={{
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--primary-color) transparent'
            }}>
                {menuItems.map((item) => renderMenuItem(item))}
            </div>

            {/* User Profile Footer */}
            <div className={`${isCollapsed ? 'p-2' : 'p-3'}`} style={{
                borderTop: '1px solid rgba(79, 70, 229, 0.15)',
                background: 'rgba(79, 70, 229, 0.03)',
                transition: 'all 0.3s ease'
            }}>
                {isCollapsed ? (
                    <div className="d-flex justify-content-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%)',
                                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                                fontSize: '1.1rem'
                            }}
                            title={user?.name}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                ) : (
                    <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%)',
                                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                                fontSize: '1.1rem'
                            }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden flex-grow-1">
                            <div className="fw-semibold text-truncate" style={{
                                fontSize: '0.9rem',
                                color: 'var(--dark-gray)'
                            }}>
                                {user?.name}
                            </div>
                            <div className="small text-truncate" style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                textTransform: 'capitalize'
                            }}>
                                {user?.role?.replace('_', ' ')}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
