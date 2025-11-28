import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Table, Button, Badge, Card, Spinner, Alert } from 'react-bootstrap';
import { FaCheck, FaTimes, FaTrash } from 'react-icons/fa';
import type { VendorData } from '../../types/vendor';

const VendorList = () => {
    const [vendors, setVendors] = useState<VendorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await api.get('/api/vendors');
            // Backend returns paginated response with data array
            setVendors(response.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch vendors');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await api.put(`/api/vendors/${id}/status`, { status });
            setSuccess(`Vendor ${status} successfully`);
            setTimeout(() => setSuccess(''), 3000);
            fetchVendors(); // Refresh list
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${status} vendor`);
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this vendor?')) return;

        try {
            await api.delete(`/api/vendors/${id}`);
            setSuccess('Vendor deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
            setVendors(vendors.filter(v => v.vendor.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete vendor');
            setTimeout(() => setError(''), 5000);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge bg="success">Approved</Badge>;
            case 'rejected': return <Badge bg="danger">Rejected</Badge>;
            default: return <Badge bg="warning" text="dark">Pending</Badge>;
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
        <div>
            <h2 className="fw-bold mb-4">Vendor Management</h2>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4 py-3">Vendor Name</th>
                                <th className="py-3">Type</th>
                                <th className="py-3">Business Field</th>
                                <th className="py-3">Location</th>
                                <th className="py-3">Status</th>
                                <th className="pe-4 py-3 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-5 text-muted">
                                        No vendors found.
                                    </td>
                                </tr>
                            ) : (
                                vendors.map((vendorData) => (
                                    <tr key={vendorData.vendor.id}>
                                        <td className="ps-4">
                                            <div className="fw-medium">
                                                {vendorData.profile?.vendor_name || 'N/A'}
                                            </div>
                                            <div className="small text-muted">
                                                {vendorData.profile?.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-capitalize">
                                                {vendorData.vendor.vendor_type}
                                            </span>
                                        </td>
                                        <td>{vendorData.profile?.business_field || 'N/A'}</td>
                                        <td>{vendorData.profile?.city || 'N/A'}</td>
                                        <td>{getStatusBadge(vendorData.vendor.status)}</td>
                                        <td className="pe-4 text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                {vendorData.vendor.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => handleStatusUpdate(vendorData.vendor.id, 'approved')}
                                                            title="Approve"
                                                        >
                                                            <FaCheck />
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleStatusUpdate(vendorData.vendor.id, 'rejected')}
                                                            title="Reject"
                                                        >
                                                            <FaTimes />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(vendorData.vendor.id)}
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </div>
    );
};

export default VendorList;
