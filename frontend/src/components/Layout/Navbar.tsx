import { useAuth } from '../../context/AuthContext';
import { FaSignOutAlt, FaBars, FaUser, FaChevronDown } from 'react-icons/fa';
import { Navbar as BsNavbar, Container, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
    onToggleMobileMenu?: () => void;
    isMobileMenuOpen?: boolean;
}

const Navbar = ({ onToggleMobileMenu }: NavbarProps) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <BsNavbar className="sticky-top" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, var(--light-gray) 50%)',
            boxShadow: 'var(--shadow)',
            borderBottom: '1px solid rgba(79, 70, 229, 0.1)',
            padding: '0.75rem 0'
        }}>
            <Container fluid className="px-3 px-lg-4">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={onToggleMobileMenu}
                    className="d-lg-none p-0 border-0"
                    style={{
                        background: 'var(--primary-color)',
                        color: 'white',
                        borderRadius: '8px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <FaBars size={18} />
                </button>

                {/* Page Title */}
                <div className="d-none d-lg-block">
                    <h5 className="m-0" style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--dark-gray)'
                    }}>
                        Vendor Management System
                    </h5>
                </div>

                {/* Right Side - Profile Dropdown */}
                <div className="ms-auto">
                    <Dropdown align="end">
                        <Dropdown.Toggle
                            variant="link"
                            id="profile-dropdown"
                            className="text-decoration-none p-0 border-0"
                            style={{
                                background: 'rgba(79, 70, 229, 0.05)',
                                borderRadius: '8px',
                                padding: '0.5rem 0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white"
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%)',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                                }}>
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-start d-none d-md-block">
                                <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'var(--dark-gray)',
                                    lineHeight: 1.3
                                }}>
                                    {user?.name}
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    textTransform: 'capitalize',
                                    lineHeight: 1.3
                                }}>
                                    {user?.role?.replace('_', ' ')}
                                </div>
                            </div>
                            <FaChevronDown
                                size={12}
                                style={{ color: 'var(--primary-color)' }}
                            />
                        </Dropdown.Toggle>

                        <Dropdown.Menu
                            style={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                                padding: '0.5rem',
                                marginTop: '0.5rem',
                                minWidth: '240px'
                            }}
                        >
                            {/* User Info Header */}
                            <div
                                className="px-3 py-2 mb-2"
                                style={{
                                    background: 'linear-gradient(135deg, var(--primary-color-light) 0%, #f0f4ff 100%)',
                                    borderRadius: '8px'
                                }}
                            >
                                <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'var(--dark-gray)'
                                }}>
                                    {user?.name}
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    textTransform: 'capitalize'
                                }}>
                                    {user?.role?.replace('_', ' ')}
                                </div>
                            </div>

                            <Dropdown.Divider style={{ margin: '0.5rem 0', borderColor: 'rgba(79, 70, 229, 0.15)' }} />

                            {/* Profile Link */}
                            <Dropdown.Item
                                as={Link}
                                to="/user-profile"
                                className="d-flex align-items-center"
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    color: 'var(--dark-gray)'
                                }}
                            >
                                <FaUser size={14} className="me-2" />
                                My Profile
                            </Dropdown.Item>

                            <Dropdown.Divider style={{ margin: '0.5rem 0', borderColor: 'rgba(79, 70, 229, 0.15)' }} />

                            {/* Logout */}
                            <Dropdown.Item
                                onClick={handleLogout}
                                className="d-flex align-items-center"
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    color: '#dc2626'
                                }}
                            >
                                <FaSignOutAlt size={14} className="me-2" />
                                Logout
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </Container>
        </BsNavbar>
    );
};

export default Navbar;
