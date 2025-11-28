import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Form, Button, Card, Alert, Container, Spinner, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

const MenuForm = () => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        path: '',
        icon: '',
        order_index: 0,
        is_active: true
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditMode) {
            fetchMenu();
        }
    }, [id]);

    const fetchMenu = async () => {
        try {
            const response = await api.get(`/api/menus/${id}`);
            const { name, display_name, path, icon, order_index, is_active } = response.data.data;
            setFormData({ name, display_name, path, icon, order_index, is_active });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch menu details');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isEditMode) {
                await api.put(`/api/menus/${id}`, formData);
            } else {
                await api.post('/api/menus', formData);
            }
            navigate('/menus');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save menu');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Container style={{ maxWidth: '600px' }}>
            <div className="mb-4">
                <Link to="/menus" className="text-decoration-none d-flex align-items-center gap-2 text-secondary mb-2">
                    <FaArrowLeft /> Back to Menus
                </Link>
                <h2 className="fw-bold">{isEditMode ? 'Edit Menu' : 'Create Menu'}</h2>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Menu Code (Name)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., user_management"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Display Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="display_name"
                                        value={formData.display_name}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., User Management"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Path</Form.Label>
                            <Form.Control
                                type="text"
                                name="path"
                                value={formData.path}
                                onChange={handleChange}
                                required
                                placeholder="e.g., /users"
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Icon Class</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="icon"
                                        value={formData.icon}
                                        onChange={handleChange}
                                        placeholder="e.g., FaUsers"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Order Index</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="order_index"
                                        value={formData.order_index}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Check
                                type="switch"
                                id="is-active-switch"
                                label="Active"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Link to="/menus" className="btn btn-light">Cancel</Link>
                            <Button type="submit" variant="primary" disabled={loading} className="d-flex align-items-center gap-2">
                                {loading ? <Spinner size="sm" animation="border" /> : <FaSave />}
                                {isEditMode ? 'Update Menu' : 'Create Menu'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default MenuForm;
