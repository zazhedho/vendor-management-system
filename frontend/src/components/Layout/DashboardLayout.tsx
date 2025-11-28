import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Container } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';

const DashboardLayout = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        // Load collapsed state from localStorage
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved ? JSON.parse(saved) : false;
    });
    const sidebarRef = useRef<HTMLDivElement>(null);

    const toggleMobileMenu = () => {
        console.log('Toggle mobile menu clicked. Current state:', isMobileMenuOpen);
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        // Save to localStorage
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    };

    const closeMobileMenu = () => {
        console.log('Closing mobile menu');
        setIsMobileMenuOpen(false);
    };

    // Debug: Log when menu state changes
    useEffect(() => {
        console.log('Mobile menu state changed:', isMobileMenuOpen);
    }, [isMobileMenuOpen]);

    // Close menu when route changes
    useEffect(() => {
        closeMobileMenu();
    }, [location.pathname]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (isMobileMenuOpen &&
                !target.closest('.sidebar') &&
                !target.closest('.mobile-menu-toggle') &&
                !target.closest('[class*="FaBars"]')) {
                closeMobileMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen]);

    return (
        <div className={`d-flex min-vh-100 position-relative ${isMobileMenuOpen ? 'sidebar-open' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
            style={{ background: 'var(--background-color)' }}>
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
                    style={{
                        zIndex: 1040,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(2px)',
                        animation: 'fadeIn 0.3s ease-in-out'
                    }}
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar Toggle Button - Desktop Only */}
            <button
                className="d-none d-lg-flex position-fixed align-items-center justify-content-center border-0"
                onClick={toggleSidebar}
                style={{
                    left: isSidebarCollapsed ? '60px' : '250px',
                    top: '20px',
                    zIndex: 1051,
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.3)';
                }}
            >
                <i className={`bi ${isSidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}
                    style={{ fontSize: '0.9rem' }}></i>
            </button>

            {/* Sidebar - Desktop: always visible, Mobile: toggle with overlay */}
            <div
                ref={sidebarRef}
                className="sidebar h-100"
                style={{
                    width: isSidebarCollapsed ? '70px' : '260px',
                    flexShrink: 0,
                    zIndex: 1050,
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                }}
            >
                <Sidebar onCloseMobileMenu={closeMobileMenu} isCollapsed={isSidebarCollapsed} />
            </div>

            {/* Desktop Sidebar Spacer */}
            <div className="d-none d-lg-block" style={{
                width: isSidebarCollapsed ? '70px' : '260px',
                flexShrink: 0,
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />

            {/* Main Content */}
            <div className="flex-grow-1 d-flex flex-column min-vh-100">
                <Navbar
                    onToggleMobileMenu={toggleMobileMenu}
                    isMobileMenuOpen={isMobileMenuOpen}
                />
                <main className="flex-grow-1 overflow-auto" style={{ padding: '1.5rem' }}>
                    <Container fluid style={{ maxWidth: '1600px' }}>
                        <Outlet />
                    </Container>
                </main>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @media (min-width: 992px) {
                    .sidebar {
                        transform: translateX(0) !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default DashboardLayout;
