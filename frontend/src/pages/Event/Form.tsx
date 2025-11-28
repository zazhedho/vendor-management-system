import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Form, Button, Card, Alert, Container, Spinner, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

const EventForm = () => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        start_date: '',
        end_date: '',
        status: 'draft'
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditMode) {
            fetchEvent();
        }
    }, [id]);

    const fetchEvent = async () => {
        try {
            const response = await api.get(`/api/events/${id}`);
            const { title, description, category, start_date, end_date, status } = response.data.data;
            // Format dates for input type="date"
            const formatDate = (dateString: string) => dateString ? new Date(dateString).toISOString().split('T')[0] : '';

            setFormData({
                title,
                description,
                category,
                start_date: formatDate(start_date),
                end_date: formatDate(end_date),
                status
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch event details');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            // Ensure dates are in ISO format if needed, but usually YYYY-MM-DD works or needs conversion
            const payload = {
                ...formData,
                start_date: new Date(formData.start_date).toISOString(),
                end_date: new Date(formData.end_date).toISOString()
            };

            if (isEditMode) {
                await api.put(`/api/events/${id}`, payload);
            } else {
                await api.post('/api/events', payload);
            }
            navigate('/events');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save event');
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
        <Container style={{ maxWidth: '800px' }}>
            <div className="mb-4">
                <Link to="/events" className="text-decoration-none d-flex align-items-center gap-2 text-secondary mb-2">
                    <FaArrowLeft /> Back to Events
                </Link>
                <h2 className="fw-bold">{isEditMode ? 'Edit Event' : 'Create Event'}</h2>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Event Title</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Annual Procurement 2024"
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        placeholder="e.g., IT Equipment"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="open">Open</option>
                                        <option value="closed">Closed</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Start Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>End Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Detailed description of the event..."
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Link to="/events" className="btn btn-light">Cancel</Link>
                            <Button type="submit" variant="primary" disabled={loading} className="d-flex align-items-center gap-2">
                                {loading ? <Spinner size="sm" animation="border" /> : <FaSave />}
                                {isEditMode ? 'Update Event' : 'Create Event'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EventForm;
