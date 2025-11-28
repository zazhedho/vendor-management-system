import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Form, Button, Card, Alert, Container, Spinner, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaSave, FaStar } from 'react-icons/fa';

interface Option {
    id: string;
    name: string; // Used for both vendor_name and title (event)
}

const EvaluationForm = () => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        event_id: '',
        vendor_id: '',
        overall_rating: 0,
        comments: '',
        photo_paths: [] as string[]
    });

    const [events, setEvents] = useState<Option[]>([]);
    const [vendors, setVendors] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([fetchEvents(), fetchVendors()]).then(() => {
            if (isEditMode) {
                fetchEvaluation();
            } else {
                setInitialLoading(false);
            }
        });
    }, [id]);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/api/events');
            // Map response to Option format if needed
            setEvents(response.data.data.map((e: any) => ({ id: e.id, name: e.title })) || []);
        } catch (err) {
            console.error('Failed to fetch events', err);
        }
    };

    const fetchVendors = async () => {
        try {
            const response = await api.get('/api/vendors');
            setVendors(response.data.data.map((v: any) => ({ id: v.id, name: v.vendor_name })) || []);
        } catch (err) {
            console.error('Failed to fetch vendors', err);
        }
    };

    const fetchEvaluation = async () => {
        try {
            const response = await api.get(`/api/evaluations/${id}`);
            const { event_id, vendor_id, overall_rating, comments, photo_paths } = response.data.data;
            setFormData({
                event_id,
                vendor_id,
                overall_rating,
                comments,
                photo_paths: photo_paths || []
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch evaluation details');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<any>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'overall_rating' ? parseFloat(value) : value
        });
    };

    const handleRatingChange = (rating: number) => {
        setFormData({ ...formData, overall_rating: rating });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isEditMode) {
                await api.put(`/api/evaluations/${id}`, formData);
            } else {
                await api.post('/api/evaluations', formData);
            }
            navigate('/evaluations');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save evaluation');
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
                <Link to="/evaluations" className="text-decoration-none d-flex align-items-center gap-2 text-secondary mb-2">
                    <FaArrowLeft /> Back to Evaluations
                </Link>
                <h2 className="fw-bold">{isEditMode ? 'Edit Evaluation' : 'New Evaluation'}</h2>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Event</Form.Label>
                                    <Form.Select
                                        name="event_id"
                                        value={formData.event_id}
                                        onChange={handleChange}
                                        required
                                        disabled={isEditMode}
                                    >
                                        <option value="">Select Event</option>
                                        {events.map(event => (
                                            <option key={event.id} value={event.id}>
                                                {event.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Vendor</Form.Label>
                                    <Form.Select
                                        name="vendor_id"
                                        value={formData.vendor_id}
                                        onChange={handleChange}
                                        required
                                        disabled={isEditMode}
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors.map(vendor => (
                                            <option key={vendor.id} value={vendor.id}>
                                                {vendor.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label className="d-block">Overall Rating</Form.Label>
                            <div className="d-flex gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                        key={star}
                                        size={24}
                                        className={`cursor-pointer ${star <= formData.overall_rating ? 'text-warning' : 'text-muted'}`}
                                        onClick={() => handleRatingChange(star)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </div>
                            <Form.Text className="text-muted">
                                Click stars to rate from 1 to 5.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Comments</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                name="comments"
                                value={formData.comments}
                                onChange={handleChange}
                                placeholder="Detailed feedback about the vendor's performance..."
                                required
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Link to="/evaluations" className="btn btn-light">Cancel</Link>
                            <Button type="submit" variant="primary" disabled={loading} className="d-flex align-items-center gap-2">
                                {loading ? <Spinner size="sm" animation="border" /> : <FaSave />}
                                {isEditMode ? 'Update Evaluation' : 'Submit Evaluation'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EvaluationForm;
