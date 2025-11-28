import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Table, Button, Badge, Card, Spinner, Alert, Container } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaFileInvoiceDollar } from 'react-icons/fa';

interface Payment {
    id: string;
    invoice_number: string;
    amount: number;
    payment_date: string;
    status: string;
    transfer_proof_path?: string;
    vendor_name?: string; // Assuming backend joins vendor name
}

const PaymentList = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const response = await api.get('/api/payments');
            setPayments(response.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this payment record?')) return;

        try {
            await api.delete(`/api/payments/${id}`);
            setSuccess('Payment deleted successfully');
            setPayments(payments.filter(p => p.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete payment');
        }
    };

    const isAdmin = ['superadmin', 'admin'].includes(user?.role || '');

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
                <h2 className="fw-bold mb-0">Payment Management</h2>
                {isAdmin && (
                    <Link to="/payments/create" className="btn btn-primary d-flex align-items-center gap-2">
                        <FaPlus /> Create Payment
                    </Link>
                )}
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4 py-3">Invoice #</th>
                                <th className="py-3">Amount</th>
                                <th className="py-3">Date</th>
                                <th className="py-3">Status</th>
                                <th className="py-3">Proof</th>
                                {isAdmin && <th className="pe-4 py-3 text-end">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="text-center py-5 text-muted">
                                        No payment records found.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="ps-4 fw-medium">
                                            <div className="d-flex align-items-center gap-2">
                                                <FaFileInvoiceDollar className="text-muted" />
                                                {payment.invoice_number}
                                            </div>
                                        </td>
                                        <td>
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(payment.amount)}
                                        </td>
                                        <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <Badge bg={
                                                payment.status === 'done' ? 'success' :
                                                    payment.status === 'on_progress' ? 'warning' : 'secondary'
                                            }>
                                                {payment.status.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td>
                                            {payment.transfer_proof_path ? (
                                                <a href={payment.transfer_proof_path} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                                    View Proof
                                                </a>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td className="pe-4 text-end">
                                                <div className="d-flex justify-content-end gap-2">
                                                    <Link
                                                        to={`/payments/edit/${payment.id}`}
                                                        className="btn btn-outline-primary btn-sm"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </Link>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(payment.id)}
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default PaymentList;
