import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Form, Button, Card, Alert, Container, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

const RoleForm = () => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditMode) {
            fetchRole();
        }
    }, [id]);

    const fetchRole = async () => {
        try {
            const response = await api.get(`/api/roles/${id}`);
            const { name, display_name, description } = response.data.data;
            setFormData({ name, display_name, description });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch role details');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isEditMode) {
                await api.put(`/api/roles/${id}`, formData);
            } else {
                await api.post('/api/roles', formData);
            }
            navigate('/roles');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save role');
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
                <Link to="/roles" className="text-decoration-none d-flex align-items-center gap-2 text-secondary mb-2">
                    <FaArrowLeft /> Back to Roles
                </Link>
                <h2 className="fw-bold">{isEditMode ? 'Edit Role' : 'Create Role'}</h2>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Role Code (Name)</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={isEditMode} // Usually role code is immutable after creation
                                placeholder="e.g., finance_manager"
                            />
                            <Form.Text className="text-muted">
                                Unique identifier for the role. Cannot be changed once created.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Display Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="display_name"
                                value={formData.display_name}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Finance Manager"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the role's responsibilities..."
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Link to="/roles" className="btn btn-light">Cancel</Link>
                            <Button type="submit" variant="primary" disabled={loading} className="d-flex align-items-center gap-2">
                                {loading ? <Spinner size="sm" animation="border" /> : <FaSave />}
                                {isEditMode ? 'Update Role' : 'Create Role'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default RoleForm;
