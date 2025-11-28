import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaPhone, FaShieldAlt, FaClock, FaKey, FaTrash, FaCheck, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const UserProfile = () => {
    const { user, updateProfile, updatePassword, deleteUser } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordValidation, setPasswordValidation] = useState({
        minLength: false,
        hasLowercase: false,
        hasUppercase: false,
        hasNumber: false,
        hasSymbol: false
    });

    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name, email: user.email, phone: user.phone || '' });
        }
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));

        if (name === 'newPassword') {
            setPasswordValidation({
                minLength: value.length >= 8,
                hasLowercase: /[a-z]/.test(value),
                hasUppercase: /[A-Z]/.test(value),
                hasNumber: /[0-9]/.test(value),
                hasSymbol: /[^a-zA-Z0-9]/.test(value)
            });
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSuccess('');
        setProfileError('');
        const result = await updateProfile(profileData);
        if (result.success) {
            setProfileSuccess('Profile updated successfully');
        } else {
            setProfileError(result.error || 'Failed to update profile');
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordSuccess('');
        setPasswordError('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        const allRequirementsMet = Object.values(passwordValidation).every(val => val === true);
        if (!allRequirementsMet) {
            setPasswordError('New password does not meet all requirements');
            return;
        }

        const result = await updatePassword(passwordData);
        if (result.success) {
            setPasswordSuccess('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordValidation({
                minLength: false,
                hasLowercase: false,
                hasUppercase: false,
                hasNumber: false,
                hasSymbol: false
            });
            navigate('/login');
        } else {
            setPasswordError(result.error || 'Failed to update password');
        }
    };

    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteAccount = async () => {
        setShowDeleteModal(false);
        const result = await deleteUser();
        if (result.success) {
            navigate('/login');
        }
    };

    const getRoleBadge = (role?: string) => {
        const variants: { [key: string]: string } = {
            superadmin: 'danger',
            admin: 'primary',
            client: 'info',
            vendor: 'success'
        };
        return <Badge bg={variants[role || ''] || 'secondary'}>{role?.replace('_', ' ').toUpperCase()}</Badge>;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">My Profile</h2>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <Link to="/dashboard">Dashboard</Link>
                            </li>
                            <li className="breadcrumb-item active">Profile</li>
                        </ol>
                    </nav>
                </div>
            </div>

            {/* Profile Info Banner */}
            <Card className="mb-4 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-dark) 100%)' }}>
                <Card.Body className="text-white py-4">
                    <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-white d-flex align-items-center justify-content-center me-3"
                            style={{ width: '70px', height: '70px' }}>
                            <FaUser size={32} style={{ color: 'var(--primary-color)' }} />
                        </div>
                        <div>
                            <h4 className="mb-1">{user?.name}</h4>
                            <p className="mb-0 opacity-75">
                                <FaEnvelope className="me-2" />{user?.email}
                                {user?.phone && (
                                    <span className="ms-3">
                                        <FaPhone className="me-2" />{user.phone}
                                    </span>
                                )}
                                <span className="ms-3">{getRoleBadge(user?.role)}</span>
                            </p>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Account Information */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-white py-3 border-bottom">
                    <h5 className="mb-0 d-flex align-items-center gap-2">
                        <FaShieldAlt className="text-primary" /> Account Information
                    </h5>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col lg={6}>
                            <table className="table table-borderless mb-0">
                                <tbody>
                                    <tr>
                                        <td className="text-muted" style={{ width: '40%' }}>
                                            <strong><FaUser className="me-2" />Name</strong>
                                        </td>
                                        <td>{user?.name}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">
                                            <strong><FaEnvelope className="me-2" />Email</strong>
                                        </td>
                                        <td>{user?.email}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">
                                            <strong><FaPhone className="me-2" />Phone</strong>
                                        </td>
                                        <td>{user?.phone || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Col>
                        <Col lg={6}>
                            <table className="table table-borderless mb-0">
                                <tbody>
                                    <tr>
                                        <td className="text-muted" style={{ width: '40%' }}>
                                            <strong><FaShieldAlt className="me-2" />Role</strong>
                                        </td>
                                        <td>{getRoleBadge(user?.role)}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">
                                            <strong><FaClock className="me-2" />Created At</strong>
                                        </td>
                                        <td>{formatDate(user?.created_at)}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">
                                            <strong><FaClock className="me-2" />Updated At</strong>
                                        </td>
                                        <td>{formatDate(user?.updated_at)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row>
                {/* Update Profile */}
                <Col lg={6} className="mb-4">
                    <Card className="h-100 border-0 shadow-sm border-start border-primary border-3">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0 d-flex align-items-center gap-2">
                                <FaUser className="text-primary" /> Update Profile
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            {profileSuccess && <Alert variant="success" dismissible onClose={() => setProfileSuccess('')}>{profileSuccess}</Alert>}
                            {profileError && <Alert variant="danger" dismissible onClose={() => setProfileError('')}>{profileError}</Alert>}
                            <Form onSubmit={handleProfileSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label><FaUser className="me-2" />Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={profileData.name}
                                        onChange={handleProfileChange}
                                        required
                                        placeholder="Enter your name"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label><FaEnvelope className="me-2" />Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleProfileChange}
                                        required
                                        placeholder="Enter your email"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label><FaPhone className="me-2" />Phone</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="phone"
                                        value={profileData.phone}
                                        onChange={handleProfileChange}
                                        placeholder="Enter your phone number"
                                    />
                                </Form.Group>
                                <Button type="submit" variant="primary" className="w-100">
                                    <FaCheck className="me-2" />Save Changes
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Change Password & Danger Zone */}
                <Col lg={6}>
                    <Card className="mb-4 border-0 shadow-sm border-start border-warning border-3">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0 d-flex align-items-center gap-2">
                                <FaKey className="text-warning" /> Change Password
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            {passwordSuccess && <Alert variant="success" dismissible onClose={() => setPasswordSuccess('')}>{passwordSuccess}</Alert>}
                            {passwordError && <Alert variant="danger" dismissible onClose={() => setPasswordError('')}>{passwordError}</Alert>}
                            <Form onSubmit={handlePasswordSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Current Password</Form.Label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            placeholder="Enter current password"
                                            style={{ paddingRight: '2.5rem' }}
                                        />
                                        <Button
                                            variant="link"
                                            className="position-absolute end-0 top-50 translate-middle-y text-muted"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            style={{ textDecoration: 'none' }}
                                            type="button"
                                        >
                                            {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                    </div>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>New Password</Form.Label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type={showNewPassword ? 'text' : 'password'}
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            placeholder="Enter new password"
                                            style={{ paddingRight: '2.5rem' }}
                                        />
                                        <Button
                                            variant="link"
                                            className="position-absolute end-0 top-50 translate-middle-y text-muted"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            style={{ textDecoration: 'none' }}
                                            type="button"
                                        >
                                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                    </div>
                                    {passwordData.newPassword && (
                                        <div className="mt-2 p-3 bg-light rounded">
                                            <small className="d-block fw-bold mb-2 text-secondary">Password Requirements:</small>
                                            <div className="d-flex flex-column gap-1">
                                                <small className={passwordValidation.minLength ? 'text-success' : 'text-danger'}>
                                                    {passwordValidation.minLength ? <FaCheck className="me-1" /> : <FaTimes className="me-1" />}
                                                    Minimum 8 characters
                                                </small>
                                                <small className={passwordValidation.hasLowercase ? 'text-success' : 'text-danger'}>
                                                    {passwordValidation.hasLowercase ? <FaCheck className="me-1" /> : <FaTimes className="me-1" />}
                                                    At least 1 lowercase letter (a-z)
                                                </small>
                                                <small className={passwordValidation.hasUppercase ? 'text-success' : 'text-danger'}>
                                                    {passwordValidation.hasUppercase ? <FaCheck className="me-1" /> : <FaTimes className="me-1" />}
                                                    At least 1 uppercase letter (A-Z)
                                                </small>
                                                <small className={passwordValidation.hasNumber ? 'text-success' : 'text-danger'}>
                                                    {passwordValidation.hasNumber ? <FaCheck className="me-1" /> : <FaTimes className="me-1" />}
                                                    At least 1 number (0-9)
                                                </small>
                                                <small className={passwordValidation.hasSymbol ? 'text-success' : 'text-danger'}>
                                                    {passwordValidation.hasSymbol ? <FaCheck className="me-1" /> : <FaTimes className="me-1" />}
                                                    At least 1 symbol (!@#$%^&*...)
                                                </small>
                                            </div>
                                        </div>
                                    )}
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Confirm New Password</Form.Label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            placeholder="Confirm new password"
                                            style={{ paddingRight: '2.5rem' }}
                                        />
                                        <Button
                                            variant="link"
                                            className="position-absolute end-0 top-50 translate-middle-y text-muted"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={{ textDecoration: 'none' }}
                                            type="button"
                                        >
                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                    </div>
                                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                        <small className="text-danger d-block mt-1">
                                            <FaTimes className="me-1" />Passwords do not match
                                        </small>
                                    )}
                                    {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                                        <small className="text-success d-block mt-1">
                                            <FaCheck className="me-1" />Passwords match
                                        </small>
                                    )}
                                </Form.Group>
                                <Button type="submit" variant="warning" className="w-100">
                                    <FaKey className="me-2" />Update Password
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-0 shadow-sm border-start border-danger border-3">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0 d-flex align-items-center gap-2 text-danger">
                                <FaTrash /> Danger Zone
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="text-muted mb-3">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                            <Button variant="danger" className="w-100" onClick={handleDeleteAccount}>
                                <FaTrash className="me-2" />Delete My Account
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <ConfirmationModal
                show={showDeleteModal}
                title="Confirm Account Deletion"
                message="Are you sure you want to delete your account? This action cannot be undone."
                confirmText="Delete Account"
                onConfirm={confirmDeleteAccount}
                onCancel={() => setShowDeleteModal(false)}
            />
        </>
    );
};

export default UserProfile;
