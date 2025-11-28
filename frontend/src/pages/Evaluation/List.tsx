import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button, Badge, Card, Spinner, Alert, Container, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaStar, FaImage } from 'react-icons/fa';

interface Evaluation {
    id: string;
    event_id: string;
    event_title?: string;
    vendor_id: string;
    vendor_name?: string;
    overall_rating: number;
    comments: string;
    photo_paths?: string[];
    created_at: string;
}

const EvaluationList = () => {
    const { user } = useAuth();
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchEvaluations();
    }, []);

    const fetchEvaluations = async () => {
        try {
            const response = await api.get('/api/evaluations');
            setEvaluations(response.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch evaluations');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this evaluation?')) return;

        try {
            await api.delete(`/api/evaluations/${id}`);
            setSuccess('Evaluation deleted successfully');
            setEvaluations(evaluations.filter(e => e.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete evaluation');
        }
    };

    const canManage = ['superadmin', 'admin', 'client'].includes(user?.role || '');

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
                <h2 className="fw-bold mb-0">Performance Evaluations</h2>
                {canManage && (
                    <Link to="/evaluations/create" className="btn btn-primary d-flex align-items-center gap-2">
                        <FaPlus /> New Evaluation
                    </Link>
                )}
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <Row>
                {evaluations.length === 0 ? (
                    <Col>
                        <Card className="text-center py-5 text-muted shadow-sm border-0">
                            <Card.Body>No evaluations found.</Card.Body>
                        </Card>
                    </Col>
                ) : (
                    evaluations.map((evaluation) => (
                        <Col md={6} lg={4} key={evaluation.id} className="mb-4">
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h5 className="fw-bold mb-1">{evaluation.vendor_name || 'Unknown Vendor'}</h5>
                                            <small className="text-muted">{evaluation.event_title || 'Unknown Event'}</small>
                                        </div>
                                        <Badge bg={evaluation.overall_rating >= 4 ? 'success' : evaluation.overall_rating >= 3 ? 'warning' : 'danger'}>
                                            <FaStar className="me-1" /> {evaluation.overall_rating}/5
                                        </Badge>
                                    </div>

                                    <p className="text-secondary mb-3" style={{ minHeight: '60px' }}>
                                        {evaluation.comments.length > 100
                                            ? `${evaluation.comments.substring(0, 100)}...`
                                            : evaluation.comments}
                                    </p>

                                    {evaluation.photo_paths && evaluation.photo_paths.length > 0 && (
                                        <div className="mb-3">
                                            <small className="text-muted d-flex align-items-center gap-1">
                                                <FaImage /> {evaluation.photo_paths.length} Photos attached
                                            </small>
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                                        <small className="text-muted">
                                            {new Date(evaluation.created_at).toLocaleDateString()}
                                        </small>
                                        {canManage && (
                                            <div className="d-flex gap-2">
                                                <Link
                                                    to={`/evaluations/edit/${evaluation.id}`}
                                                    className="btn btn-outline-primary btn-sm"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(evaluation.id)}
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))
                )}
            </Row>
        </Container>
    );
};

export default EvaluationList;
