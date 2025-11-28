import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Form, Button, Card, Alert, Container, Spinner, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

interface Vendor {
    id: string;
    vendor_name: string;
}

const PaymentForm = () => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        invoice_number: '',
        vendor_id: '',
        amount: 0,
        payment_date: '',
        status: 'on_progress',
        description: '',
        transfer_proof_path: ''
    });
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVendors();
        if (isEditMode) {
            fetchPayment();
        } else {
            setInitialLoading(false);
        }
    }, [id]);

    const fetchVendors = async () => {
        try {
            const response = await api.get('/api/vendors'); // Assuming this endpoint returns a list of vendors
            // Filter only approved vendors if needed, or backend handles it
            setVendors(response.data.data || []);
        } catch (err) {
            console.error('Failed to fetch vendors', err);
        }
    };

    const fetchPayment = async () => {
        try {
            const response = await api.get(`/api/payments/${id}`);
            const { invoice_number, vendor_id, amount, payment_date, status, description, transfer_proof_path } = response.data.data;

            const formatDate = (dateString: string) => dateString ? new Date(dateString).toISOString().split('T')[0] : '';

            setFormData({
                invoice_number,
                vendor_id,
                amount,
                payment_date: formatDate(payment_date),
                status,
                description,
                transfer_proof_path
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch payment details');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<any>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'amount' ? parseFloat(value) : value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                ...formData,
                payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : null
            };

            if (isEditMode) {
                await api.put(`/api/payments/${id}`, payload);
            } else {
                await api.post('/api/payments', payload);
            }
            navigate('/payments');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save payment');
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
                <Link to="/payments" className="text-decoration-none d-flex align-items-center gap-2 text-secondary mb-2">
                    <FaArrowLeft /> Back to Payments
                </Link>
                <h2 className="fw-bold">{isEditMode ? 'Edit Payment' : 'Create Payment'}</h2>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Invoice Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="invoice_number"
                                        value={formData.invoice_number}
                                        onChange={handleChange}
                                        required
                                        placeholder="INV-2024-001"
                                    />
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
                                        disabled={isEditMode} // Usually vendor shouldn't change on edit
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors.map(vendor => (
                                            <option key={vendor.id} value={vendor.id}>
                                                {vendor.vendor_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Amount (IDR)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Payment Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="payment_date"
                                        value={formData.payment_date}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="on_progress">On Progress</option>
                                        <option value="done">Done</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Transfer Proof URL</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="transfer_proof_path"
                                        value={formData.transfer_proof_path}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                    />
                                    <Form.Text className="text-muted">
                                        URL to the proof of transfer document/image.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Payment details..."
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Link to="/payments" className="btn btn-light">Cancel</Link>
                            <Button type="submit" variant="primary" disabled={loading} className="d-flex align-items-center gap-2">
                                {loading ? <Spinner size="sm" animation="border" /> : <FaSave />}
                                {isEditMode ? 'Update Payment' : 'Create Payment'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default PaymentForm;
