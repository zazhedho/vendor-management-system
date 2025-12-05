import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MenuItem } from '../types';
import { buildMenuHierarchy, getFallbackMenus } from '../utils/menuUtils';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, userMenus, hasPermission } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const menuLoadedRef = useRef(false);

  useEffect(() => {
    if (menuLoadedRef.current) return;

    if (userMenus && userMenus.length > 0) {
      // Filter out profile menu and build hierarchy
      const filteredMenus = userMenus
        .filter((menu) => menu.is_active && menu.name !== 'profile' && menu.url !== '/profile');

      const hierarchicalMenus = buildMenuHierarchy(filteredMenus);
      setMenuItems(hierarchicalMenus);
      menuLoadedRef.current = true;
    } else if (user) {
      // Use fallback menus based on permissions
      const fallbackMenus = getFallbackMenus((resource, action, name) => {
        if (!resource || !action) return false;

        if (name === 'submissions') {
          return (
            hasPermission('event', 'view_submissions') ||
            hasPermission('vendor', 'view_submissions') ||
            hasPermission('event', 'submit_pitch')
          );
        }

        return hasPermission(resource, action);
      });
      setMenuItems(fallbackMenus);
      menuLoadedRef.current = true;
    }
  }, [userMenus, user, hasPermission]);

  const toggleSidebarCollapse = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col lg:flex-row">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        menuItems={menuItems}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
