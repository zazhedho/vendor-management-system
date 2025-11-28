import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Form, Button, Spinner, Alert, Container, Row, Col } from 'react-bootstrap';
import { FaEnvelope, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaShieldAlt, FaChartLine, FaUsers, FaCheckCircle } from 'react-icons/fa';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/user/login', { email, password });
            const { token } = response.data.data;

            // Store token first for axios interceptor
            localStorage.setItem('token', token);

            // Fetch user data
            const userResponse = await api.get('/api/user');
            const user = userResponse.data.data;

            // Now login with both token and user
            login(token, user);

            // Redirect after successful login
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="vh-100 p-0 overflow-hidden">
            <Row className="h-100 g-0">
                {/* Left Side - Branding */}
                <Col lg={6} className="d-none d-lg-flex flex-column justify-content-center align-items-center text-white p-5 position-relative" style={{ overflow: 'hidden' }}>
                    {/* Background with modern gradient */}
                    <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                        background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
                        zIndex: 0
                    }}></div>

                    {/* Animated geometric patterns */}
                    <div className="position-absolute top-0 start-0 w-100 h-100" style={{ zIndex: 1 }}>
                        <div className="position-absolute" style={{
                            width: '500px',
                            height: '500px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                            top: '-150px',
                            right: '-100px',
                            animation: 'float 20s infinite ease-in-out'
                        }}></div>
                        <div className="position-absolute" style={{
                            width: '350px',
                            height: '350px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                            bottom: '-100px',
                            left: '-80px',
                            animation: 'float 15s infinite ease-in-out reverse'
                        }}></div>
                        <div className="position-absolute" style={{
                            width: '200px',
                            height: '200px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            borderRadius: '50%',
                            top: '20%',
                            left: '10%',
                            animation: 'float 25s infinite ease-in-out'
                        }}></div>
                    </div>

                    {/* Content */}
                    <div className="position-relative text-center" style={{ maxWidth: '550px', zIndex: 2 }}>
                        {/* Logo/Icon */}
                        <div className="mb-5">
                            <div className="d-inline-flex align-items-center justify-content-center mb-4" style={{
                                width: '120px',
                                height: '120px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '30px',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                            }}>
                                <FaShieldAlt size={55} className="text-white" />
                            </div>
                            <h1 className="display-5 fw-bold mb-3" style={{ letterSpacing: '-0.5px' }}>
                                Vendor Management
                            </h1>
                            <p className="fs-5 mb-0 opacity-90">
                                Sistem Terpadu Pengelolaan Vendor
                            </p>
                        </div>

                        {/* Features */}
                        <div className="mb-5">
                            <div className="row g-4 text-start">
                                <div className="col-12">
                                    <div className="d-flex align-items-start" style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '20px',
                                        borderRadius: '15px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>
                                        <div className="me-3 mt-1">
                                            <FaCheckCircle size={24} className="text-white opacity-75" />
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-1">Manajemen Vendor Terpusat</h6>
                                            <p className="small mb-0 opacity-75">Kelola semua data vendor dalam satu platform terintegrasi</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="d-flex align-items-start" style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '20px',
                                        borderRadius: '15px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>
                                        <div className="me-3 mt-1">
                                            <FaChartLine size={24} className="text-white opacity-75" />
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-1">Evaluasi & Monitoring Real-time</h6>
                                            <p className="small mb-0 opacity-75">Pantau kinerja vendor dengan dashboard analitik</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="d-flex align-items-start" style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '20px',
                                        borderRadius: '15px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>
                                        <div className="me-3 mt-1">
                                            <FaUsers size={24} className="text-white opacity-75" />
                                        </div>
                                        <div>
                                            <h6 className="fw-bold mb-1">Kolaborasi Efektif</h6>
                                            <p className="small mb-0 opacity-75">Tingkatkan komunikasi dan koordinasi dengan vendor</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add animation keyframes */}
                    <style>{`
                        @keyframes float {
                            0%, 100% {
                                transform: translate(0, 0) rotate(0deg);
                            }
                            33% {
                                transform: translate(30px, -30px) rotate(120deg);
                            }
                            66% {
                                transform: translate(-20px, 20px) rotate(240deg);
                            }
                        }
                    `}</style>
                </Col>

                {/* Right Side - Login Form */}
                <Col lg={6} className="d-flex align-items-center justify-content-center bg-light">
                    <div className="w-100 p-4 p-md-5" style={{ maxWidth: '550px' }}>
                        <div className="text-center mb-5">
                            <h2 className="fw-bold text-dark mb-2">Welcome Back!</h2>
                            <p className="text-muted">Please sign in to continue to your dashboard.</p>
                        </div>

                        {error && (
                            <Alert variant="danger" className="border-0 shadow-sm mb-4 d-flex align-items-center">
                                <FaSignInAlt className="me-2" /> {error}
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-4" controlId="formBasicEmail">
                                <Form.Label className="fw-medium text-secondary small text-uppercase ls-1">Email Address</Form.Label>
                                <div className={`input-group input-group-lg shadow-sm ${emailTouched && !validateEmail(email) && email ? 'is-invalid' : ''}`}>
                                    <span className={`input-group-text bg-white border-end-0 ${emailTouched && !validateEmail(email) && email ? 'border-danger text-danger' : 'text-muted'}`}>
                                        <FaEnvelope />
                                    </span>
                                    <Form.Control
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={() => setEmailTouched(true)}
                                        required
                                        className={`border-start-0 ps-0 bg-white ${emailTouched && !validateEmail(email) && email ? 'is-invalid' : ''}`}
                                        style={{ fontSize: '0.95rem' }}
                                        isInvalid={emailTouched && !validateEmail(email) && email.length > 0}
                                    />
                                </div>
                                {emailTouched && !validateEmail(email) && email && (
                                    <Form.Text className="text-danger small">
                                        Please enter a valid email address
                                    </Form.Text>
                                )}
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="formBasicPassword">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <Form.Label className="fw-medium text-secondary small text-uppercase ls-1 mb-0">Password</Form.Label>
                                    <Link to="/forgot-password" style={{ fontSize: '0.85rem' }} className="text-decoration-none">Forgot Password?</Link>
                                </div>
                                <div className="input-group input-group-lg shadow-sm">
                                    <span className="input-group-text bg-white border-end-0 text-muted">
                                        <FaLock />
                                    </span>
                                    <Form.Control
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="border-start-0 border-end-0 ps-0 bg-white"
                                        style={{ fontSize: '0.95rem' }}
                                    />
                                    <span
                                        className="input-group-text bg-white border-start-0 cursor-pointer"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {showPassword ? <FaEyeSlash className="text-muted" /> : <FaEye className="text-muted" />}
                                    </span>
                                </div>
                            </Form.Group>

                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100 py-3 fw-bold shadow-sm mb-4 text-uppercase ls-1"
                                disabled={loading}
                                style={{ transition: 'all 0.2s' }}
                            >
                                {loading ? <Spinner animation="border" size="sm" /> : 'Sign In'}
                            </Button>

                            <div className="text-center">
                                <p className="text-muted mb-0">
                                    Don't have an account? <Link to="/register" className="fw-bold text-decoration-none">Create Account</Link>
                                </p>
                            </div>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
