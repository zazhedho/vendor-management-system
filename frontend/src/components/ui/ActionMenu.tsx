import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  hidden?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = React.memo(({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, openUpward: false });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleItems = items.filter(item => !item.hidden);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuHeight = visibleItems.length * 40 + 8;
      const menuWidth = 160;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const openUpward = spaceBelow < menuHeight;
      
      setMenuPosition({
        top: openUpward ? buttonRect.top - menuHeight : buttonRect.bottom + 4,
        left: Math.min(buttonRect.right - menuWidth, window.innerWidth - menuWidth - 8),
        openUpward,
      });
    }
    
    setIsOpen(!isOpen);
  };

  if (visibleItems.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-1.5 rounded-lg hover:bg-secondary-100 transition-colors"
      >
        <MoreVertical size={18} className="text-secondary-500" />
      </button>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
          }}
          className="w-40 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-[9999]"
        >
          {visibleItems.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-secondary-50 transition-colors ${
                item.variant === 'danger' 
                  ? 'text-danger-600 hover:bg-danger-50' 
                  : 'text-secondary-700'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
});
