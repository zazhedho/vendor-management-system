import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Row, Col, Spinner, Alert, Container } from 'react-bootstrap';
import { FaCalendarAlt, FaPlus } from 'react-icons/fa';

interface Event {
    id: string;
    title: string;
    description: string;
    category: string;
    start_date: string;
    end_date: string;
    status: string;
}

const EventList = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/api/events');
            setEvents(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <Badge bg="success">Open</Badge>;
            case 'closed': return <Badge bg="secondary">Closed</Badge>;
            case 'draft': return <Badge bg="warning" text="dark">Draft</Badge>;
            case 'completed': return <Badge bg="info">Completed</Badge>;
            case 'cancelled': return <Badge bg="danger">Cancelled</Badge>;
            default: return <Badge bg="light" text="dark">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Events</h2>
                {['superadmin', 'admin', 'client'].includes(user?.role || '') && (
                    <Link to="/events/create" className="btn btn-primary d-flex align-items-center gap-2">
                        <FaPlus /> Create Event
                    </Link>
                )}
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            {events.length === 0 ? (
                <div className="text-center py-5 text-muted bg-white rounded shadow-sm">
                    <FaCalendarAlt size={48} className="mb-3 opacity-50" />
                    <h4>No events found</h4>
                    <p>There are no events available at the moment.</p>
                </div>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {events.map((event) => (
                        <Col key={event.id}>
                            <Card className="h-100 shadow-sm border-0 hover-shadow transition-all">
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <Badge bg="light" text="primary" className="border border-primary-subtle">
                                            {event.category || 'General'}
                                        </Badge>
                                        {getStatusBadge(event.status)}
                                    </div>

                                    <Card.Title className="fw-bold mb-2">{event.title}</Card.Title>
                                    <Card.Text className="text-muted small flex-grow-1 line-clamp-3">
                                        {event.description}
                                    </Card.Text>

                                    <div className="mt-3 pt-3 border-top">
                                        <div className="d-flex justify-content-between align-items-center mb-3 text-muted small">
                                            <span>Start: {new Date(event.start_date).toLocaleDateString()}</span>
                                            <span>End: {new Date(event.end_date).toLocaleDateString()}</span>
                                        </div>

                                        <div className="d-grid gap-2">
                                            <Link to={`/events/${event.id}`} className="btn btn-outline-primary">
                                                View Details
                                            </Link>
                                            {['superadmin', 'admin', 'client'].includes(user?.role || '') && (
                                                <Link to={`/events/edit/${event.id}`} className="btn btn-outline-secondary">
                                                    Edit Event
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default EventList;
