import { Menu, MenuItem } from '../types';

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

export const getFallbackMenus = (role?: string): MenuItem[] => {
  const baseMenus: MenuItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', name: 'dashboard', children: [] },
    { path: '/events', label: 'Events', icon: 'Calendar', name: 'events', children: [] },
    { path: '/vendors', label: 'Vendors', icon: 'ShoppingBag', name: 'vendors', children: [] },
    { path: '/payments', label: 'Payments', icon: 'CreditCard', name: 'payments', children: [] },
    { path: '/evaluations', label: 'Evaluations', icon: 'Star', name: 'evaluations', children: [] },
  ];

  if (role === 'admin' || role === 'superadmin') {
    return [
      ...baseMenus,
      { path: '/users', label: 'Users', icon: 'Users', name: 'users', children: [] },
      { path: '/roles', label: 'Roles', icon: 'Shield', name: 'roles', children: [] },
      { path: '/menus', label: 'Menus', icon: 'List', name: 'menus', children: [] },
    ];
  }

  return baseMenus;
};
