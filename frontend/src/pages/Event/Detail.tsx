import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Badge, Row, Col, Spinner, Alert, Container, Form } from 'react-bootstrap';
import { FaArrowLeft, FaCalendarAlt, FaFileAlt, FaPaperPlane } from 'react-icons/fa';

interface Event {
    id: string;
    title: string;
    description: string;
    category: string;
    start_date: string;
    end_date: string;
    status: string;
    terms_file_path?: string;
}

const EventDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pitch state
    const [pitchFile, setPitchFile] = useState<File | null>(null);
    const [proposalDetails, setProposalDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [pitchSuccess, setPitchSuccess] = useState('');
    const [pitchError, setPitchError] = useState('');

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const response = await api.get(`/api/events/${id}`);
            setEvent(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch event details');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPitchFile(e.target.files[0]);
        }
    };

    const handlePitchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pitchFile) {
            setPitchError('Please upload a pitch document');
            return;
        }

        setSubmitting(true);
        setPitchError('');
        setPitchSuccess('');

        try {
            // In a real app, we would upload the file first to get a path, 
            // or use FormData to send file + data. 
            // For this mock, we'll assume a file upload endpoint exists or just send metadata.

            // Simulating file upload and getting a path
            const pitchFilePath = `uploads/pitches/${pitchFile.name}`;

            await api.post('/api/submissions', {
                event_id: id,
                pitch_file_path: pitchFilePath,
                proposal_details: proposalDetails
            });

            setPitchSuccess('Pitch submitted successfully!');
            setPitchFile(null);
            setProposalDetails('');
        } catch (err: any) {
            setPitchError(err.response?.data?.message || 'Failed to submit pitch');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (!event) {
        return <Alert variant="danger">Event not found</Alert>;
    }

    const isVendor = user?.role === 'vendor';
    const canPitch = isVendor && event.status === 'open';

    return (
        <Container>
            <div className="mb-4">
                <Link to="/events" className="text-decoration-none d-flex align-items-center gap-2 text-secondary mb-2">
                    <FaArrowLeft /> Back to Events
                </Link>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col lg={8}>
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body className="p-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <Badge bg="primary" className="mb-2">{event.category || 'General'}</Badge>
                                <Badge bg={event.status === 'open' ? 'success' : 'secondary'}>{event.status}</Badge>
                            </div>

                            <h1 className="fw-bold mb-3">{event.title}</h1>

                            <div className="d-flex gap-4 text-muted mb-4">
                                <div className="d-flex align-items-center gap-2">
                                    <FaCalendarAlt />
                                    <span>Start: {new Date(event.start_date).toLocaleDateString()}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <FaCalendarAlt />
                                    <span>End: {new Date(event.end_date).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <h5 className="fw-bold mt-4 mb-3">Description</h5>
                            <p className="text-secondary" style={{ whiteSpace: 'pre-wrap' }}>
                                {event.description}
                            </p>

                            {event.terms_file_path && (
                                <div className="mt-4 p-3 bg-light rounded border">
                                    <div className="d-flex align-items-center gap-3">
                                        <FaFileAlt className="text-primary" size={24} />
                                        <div>
                                            <div className="fw-medium">Terms of Reference</div>
                                            <a href="#" className="small text-decoration-none">Download Document</a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    {canPitch ? (
                        <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
                            <Card.Header className="bg-white py-3">
                                <h5 className="mb-0 fw-bold">Submit Pitch</h5>
                            </Card.Header>
                            <Card.Body className="p-4">
                                {pitchSuccess && <Alert variant="success">{pitchSuccess}</Alert>}
                                {pitchError && <Alert variant="danger">{pitchError}</Alert>}

                                <Form onSubmit={handlePitchSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Proposal Details</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={proposalDetails}
                                            onChange={(e) => setProposalDetails(e.target.value)}
                                            placeholder="Describe your proposal..."
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Pitch Document (PDF)</Form.Label>
                                        <Form.Control
                                            type="file"
                                            onChange={handleFileChange}
                                            accept=".pdf,.doc,.docx"
                                            required
                                        />
                                    </Form.Group>

                                    <div className="d-grid">
                                        <Button type="submit" variant="primary" disabled={submitting}>
                                            {submitting ? <Spinner size="sm" animation="border" /> : <FaPaperPlane className="me-2" />}
                                            Submit Pitch
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Card className="shadow-sm border-0 bg-light">
                            <Card.Body className="text-center py-5 text-muted">
                                {isVendor ? (
                                    <p>This event is not open for pitches.</p>
                                ) : (
                                    <p>Login as a vendor to submit a pitch.</p>
                                )}
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default EventDetail;
