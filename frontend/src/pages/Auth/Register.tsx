import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Form, Button, Spinner, Alert, Container, Row, Col, ProgressBar } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserPlus, FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'vendor' // Default role
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordFeedback, setPasswordFeedback] = useState<string[]>([]);
    const navigate = useNavigate();

    const checkPasswordStrength = (password: string) => {
        let strength = 0;
        const feedback: string[] = [];

        if (password.length >= 8) {
            strength += 25;
        } else {
            feedback.push('At least 8 characters');
        }

        if (/[a-z]/.test(password)) {
            strength += 25;
        } else {
            feedback.push('Add lowercase letter');
        }

        if (/[A-Z]/.test(password)) {
            strength += 25;
        } else {
            feedback.push('Add uppercase letter');
        }

        if (/[0-9]/.test(password)) {
            strength += 12.5;
        } else {
            feedback.push('Add number');
        }

        if (/[^a-zA-Z0-9]/.test(password)) {
            strength += 12.5;
        } else {
            feedback.push('Add special character');
        }

        setPasswordStrength(strength);
        setPasswordFeedback(feedback);
    };

    useEffect(() => {
        if (formData.password) {
            checkPasswordStrength(formData.password);
        } else {
            setPasswordStrength(0);
            setPasswordFeedback([]);
        }
    }, [formData.password]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const getStrengthColor = () => {
        if (passwordStrength < 50) return 'danger';
        if (passwordStrength < 75) return 'warning';
        return 'success';
    };

    const getStrengthText = () => {
        if (passwordStrength < 50) return 'Weak';
        if (passwordStrength < 75) return 'Medium';
        return 'Strong';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;
            await api.post('/api/user/register', registerData);
            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error?.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="vh-100 p-0 overflow-hidden">
            <Row className="h-100 g-0">
                {/* Left Side - Branding (Order 2 on mobile to be at bottom or hidden) */}
                <Col lg={6} className="d-none d-lg-flex flex-column justify-content-center align-items-center bg-dark text-white p-5 position-relative">
                    <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                        background: 'linear-gradient(135deg, #212529 0%, #343a40 100%)',
                        opacity: 0.95,
                        zIndex: 0
                    }}></div>
                    <div className="position-relative z-1 text-center" style={{ maxWidth: '500px' }}>
                        <div className="mb-4 bg-primary rounded-circle d-inline-flex align-items-center justify-content-center shadow-lg" style={{ width: '100px', height: '100px' }}>
                            <FaUserPlus className="text-white" size={40} />
                        </div>
                        <h1 className="display-4 fw-bold mb-3">Join Our Network</h1>
                        <p className="lead opacity-75 mb-4">
                            Become a part of our trusted vendor ecosystem. Register today to start managing your contracts and opportunities.
                        </p>
                        <ul className="list-unstyled text-start d-inline-block opacity-75">
                            <li className="mb-2">✓ Access to exclusive opportunities</li>
                            <li className="mb-2">✓ Streamlined contract management</li>
                            <li className="mb-2">✓ Transparent performance evaluation</li>
                        </ul>
                    </div>
                    {/* Decorative Shapes */}
                    <div className="position-absolute border border-white opacity-10" style={{ width: '400px', height: '400px', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', top: '-100px', right: '-100px' }}></div>
                </Col>

                {/* Right Side - Register Form */}
                <Col lg={6} className="d-flex align-items-center justify-content-center bg-light overflow-auto">
                    <div className="w-100 p-4 p-md-5" style={{ maxWidth: '600px' }}>
                        <div className="text-center mb-4">
                            <h2 className="fw-bold text-dark mb-2">Create Account</h2>
                            <p className="text-muted">Register as a new vendor to get started.</p>
                        </div>

                        {error && <Alert variant="danger" className="border-0 shadow-sm mb-4">{error}</Alert>}
                        {success && <Alert variant="success" className="border-0 shadow-sm mb-4">{success}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="formName">
                                        <Form.Label className="fw-medium text-secondary small text-uppercase ls-1">Full Name</Form.Label>
                                        <div className="input-group shadow-sm">
                                            <span className="input-group-text bg-white border-end-0 text-muted"><FaUser /></span>
                                            <Form.Control
                                                type="text"
                                                name="name"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="border-start-0 ps-0 bg-white"
                                            />
                                        </div>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="formPhone">
                                        <Form.Label className="fw-medium text-secondary small text-uppercase ls-1">Phone Number</Form.Label>
                                        <div className="input-group shadow-sm">
                                            <span className="input-group-text bg-white border-end-0 text-muted"><FaPhone /></span>
                                            <Form.Control
                                                type="tel"
                                                name="phone"
                                                placeholder="+62..."
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                                className="border-start-0 ps-0 bg-white"
                                            />
                                        </div>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3" controlId="formEmail">
                                <Form.Label className="fw-medium text-secondary small text-uppercase ls-1">Email Address</Form.Label>
                                <div className="input-group shadow-sm">
                                    <span className="input-group-text bg-white border-end-0 text-muted"><FaEnvelope /></span>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        placeholder="name@company.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="border-start-0 ps-0 bg-white"
                                    />
                                </div>
                            </Form.Group>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="formPassword">
                                        <Form.Label className="fw-medium text-secondary small text-uppercase ls-1">Password</Form.Label>
                                        <div className="input-group shadow-sm">
                                            <span className="input-group-text bg-white border-end-0 text-muted"><FaLock /></span>
                                            <Form.Control
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                placeholder="Min 8 chars"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                minLength={8}
                                                className="border-start-0 border-end-0 ps-0 bg-white"
                                            />
                                            <span
                                                className="input-group-text bg-white border-start-0 cursor-pointer"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {showPassword ? <FaEyeSlash className="text-muted" /> : <FaEye className="text-muted" />}
                                            </span>
                                        </div>
                                        {formData.password && (
                                            <>
                                                <div className="mt-2">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <small className="text-muted">Password Strength:</small>
                                                        <small className={`fw-bold text-${getStrengthColor()}`}>{getStrengthText()}</small>
                                                    </div>
                                                    <ProgressBar
                                                        now={passwordStrength}
                                                        variant={getStrengthColor()}
                                                        style={{ height: '4px' }}
                                                    />
                                                </div>
                                                {passwordFeedback.length > 0 && (
                                                    <div className="mt-2">
                                                        {passwordFeedback.map((feedback, idx) => (
                                                            <div key={idx} className="small text-muted d-flex align-items-center">
                                                                <FaTimes className="text-danger me-1" size={10} /> {feedback}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-4" controlId="formConfirmPassword">
                                        <Form.Label className="fw-medium text-secondary small text-uppercase ls-1">Confirm Password</Form.Label>
                                        <div className="input-group shadow-sm">
                                            <span className="input-group-text bg-white border-end-0 text-muted"><FaLock /></span>
                                            <Form.Control
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                placeholder="Confirm password"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                                minLength={8}
                                                className="border-start-0 border-end-0 ps-0 bg-white"
                                                isInvalid={formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword}
                                            />
                                            <span
                                                className="input-group-text bg-white border-start-0 cursor-pointer"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {showConfirmPassword ? <FaEyeSlash className="text-muted" /> : <FaEye className="text-muted" />}
                                            </span>
                                        </div>
                                        {formData.confirmPassword && (
                                            <div className="mt-2">
                                                {formData.password === formData.confirmPassword ? (
                                                    <small className="text-success d-flex align-items-center">
                                                        <FaCheck className="me-1" size={12} /> Passwords match
                                                    </small>
                                                ) : (
                                                    <small className="text-danger d-flex align-items-center">
                                                        <FaTimes className="me-1" size={12} /> Passwords do not match
                                                    </small>
                                                )}
                                            </div>
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Button
                                variant="dark"
                                type="submit"
                                className="w-100 py-3 fw-bold shadow-sm mb-4 text-uppercase ls-1"
                                disabled={loading}
                            >
                                {loading ? <Spinner animation="border" size="sm" /> : 'Register Account'}
                            </Button>

                            <div className="text-center">
                                <p className="text-muted mb-0">
                                    Already have an account? <Link to="/login" className="fw-bold text-decoration-none">Sign In</Link>
                                </p>
                            </div>
                        </Form>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;
