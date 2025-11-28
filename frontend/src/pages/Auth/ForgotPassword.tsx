import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Form, Button, Spinner, Alert, Container, Row, Col, Card } from 'react-bootstrap';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

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

        setLoading(true);

        try {
            await api.post('/api/user/forgot-password', { email });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
            <Row className="w-100 justify-content-center">
                <Col xs={12} sm={10} md={8} lg={5} xl={4}>
                    <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
                        <Card.Body className="p-5">
                            {!success ? (
                                <>
                                    <div className="text-center mb-4">
                                        <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                            style={{ width: '80px', height: '80px' }}>
                                            <FaEnvelope className="text-primary" size={32} />
                                        </div>
                                        <h2 className="fw-bold text-dark mb-2">Forgot Password?</h2>
                                        <p className="text-muted mb-0">
                                            Enter your email address and we'll send you instructions to reset your password.
                                        </p>
                                    </div>

                                    {error && (
                                        <Alert variant="danger" className="border-0 shadow-sm mb-4">
                                            {error}
                                        </Alert>
                                    )}

                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-4" controlId="formBasicEmail">
                                            <Form.Label className="fw-medium text-secondary small">Email Address</Form.Label>
                                            <div className="input-group input-group-lg shadow-sm">
                                                <span className="input-group-text bg-white border-end-0 text-muted">
                                                    <FaEnvelope />
                                                </span>
                                                <Form.Control
                                                    type="email"
                                                    placeholder="name@company.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="border-start-0 ps-0 bg-white"
                                                    style={{ fontSize: '1rem' }}
                                                />
                                            </div>
                                        </Form.Group>

                                        <Button
                                            variant="primary"
                                            type="submit"
                                            className="w-100 py-3 fw-bold shadow-sm mb-3"
                                            disabled={loading}
                                        >
                                            {loading ? <Spinner animation="border" size="sm" /> : 'Send Reset Instructions'}
                                        </Button>

                                        <Link
                                            to="/login"
                                            className="btn btn-outline-secondary w-100 py-3 fw-medium d-flex align-items-center justify-content-center gap-2"
                                        >
                                            <FaArrowLeft size={14} /> Back to Login
                                        </Link>
                                    </Form>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                                        style={{ width: '100px', height: '100px' }}>
                                        <FaCheckCircle className="text-success" size={48} />
                                    </div>
                                    <h3 className="fw-bold text-dark mb-3">Check Your Email</h3>
                                    <p className="text-muted mb-4">
                                        We've sent password reset instructions to <strong>{email}</strong>
                                    </p>
                                    <p className="text-muted small mb-4">
                                        Didn't receive the email? Check your spam folder or try again.
                                    </p>
                                    <Link
                                        to="/login"
                                        className="btn btn-primary w-100 py-3 fw-bold"
                                    >
                                        Return to Login
                                    </Link>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    <div className="text-center mt-4">
                        <p className="text-muted small mb-0">
                            Need help? <a href="mailto:support@company.com" className="text-decoration-none">Contact Support</a>
                        </p>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default ForgotPassword;
