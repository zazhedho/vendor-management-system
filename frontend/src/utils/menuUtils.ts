import { Menu, MenuItem } from '../types';

type FallbackMenu = MenuItem & { resource?: string; action?: string };

export const buildMenuHierarchy = (flatMenus: Menu[]): MenuItem[] => {
  const menuMap: Record<string, MenuItem> = {};
  const rootMenus: MenuItem[] = [];

  // First pass: create a map of all menus
  flatMenus.forEach(menu => {
    // Use path from database, fallback to converting name if not set
    let menuPath = menu.path;
    if (!menuPath) {
      // Convert menu name to path: vendor_profile -> /vendor/profile
      menuPath = '/' + menu.name.replace(/_/g, '/');
    }
    
    menuMap[menu.id || menu.name] = {
      id: menu.id,
      path: menuPath,
      label: menu.display_name,
      icon: menu.icon || 'Home',
      name: menu.name,
      parentId: menu.parent_id || null,
      orderIndex: menu.order_index || 0,
      children: [],
    };
  });

  // Second pass: build hierarchy
  flatMenus.forEach(menu => {
    const menuItem = menuMap[menu.id || menu.name];
    if (menu.parent_id && menuMap[menu.parent_id]) {
      menuMap[menu.parent_id].children.push(menuItem);
    } else if (!menu.parent_id) {
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

export const getFallbackMenus = (
  canAccess: (resource?: string, action?: string, name?: string) => boolean
): MenuItem[] => {
  const baseMenus: FallbackMenu[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', name: 'dashboard', children: [], resource: 'dashboard', action: 'view' },
    { path: '/events', label: 'Events', icon: 'Calendar', name: 'events', children: [], resource: 'event', action: 'view' },
    { path: '/vendors', label: 'Vendors', icon: 'ShoppingBag', name: 'vendors', children: [], resource: 'vendor', action: 'view' },
    { path: '/payments', label: 'Payments', icon: 'CreditCard', name: 'payments', children: [], resource: 'payment', action: 'view' },
    { path: '/evaluations', label: 'Evaluations', icon: 'Star', name: 'evaluations', children: [], resource: 'evaluation', action: 'view' },
    { path: '/submissions', label: 'Submissions', icon: 'Inbox', name: 'submissions', children: [], resource: 'event', action: 'view_submissions' },
    { path: '/users', label: 'Users', icon: 'Users', name: 'users', children: [], resource: 'users', action: 'view' },
    { path: '/roles', label: 'Roles', icon: 'Shield', name: 'roles', children: [], resource: 'roles', action: 'view' },
    { path: '/menus', label: 'Menus', icon: 'List', name: 'menus', children: [], resource: 'roles', action: 'assign_menus' },
  ];

  return baseMenus
    .filter((menu) => canAccess(menu.resource, menu.action, menu.name))
    .map(({ resource, action, ...menu }) => menu);
};
