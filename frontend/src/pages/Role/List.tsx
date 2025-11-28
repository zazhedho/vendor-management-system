import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Table, Button, Badge, Card, Spinner, Alert, Container } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaShieldAlt } from 'react-icons/fa';

interface Role {
    id: string;
    name: string;
    display_name: string;
    description: string;
    is_system: boolean;
    created_at: string;
}

const RoleList = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/api/roles');
            setRoles(response.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch roles');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;

        try {
            await api.delete(`/api/roles/${id}`);
            setSuccess('Role deleted successfully');
            setRoles(roles.filter(r => r.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete role');
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
                <h2 className="fw-bold mb-0">Role Management</h2>
                <Link to="/roles/create" className="btn btn-primary d-flex align-items-center gap-2">
                    <FaPlus /> Create Role
                </Link>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4 py-3">Display Name</th>
                                <th className="py-3">Name (Code)</th>
                                <th className="py-3">Description</th>
                                <th className="py-3">Type</th>
                                <th className="pe-4 py-3 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-5 text-muted">
                                        No roles found.
                                    </td>
                                </tr>
                            ) : (
                                roles.map((role) => (
                                    <tr key={role.id}>
                                        <td className="ps-4 fw-medium">
                                            <div className="d-flex align-items-center gap-2">
                                                <FaShieldAlt className="text-muted" />
                                                {role.display_name}
                                            </div>
                                        </td>
                                        <td><code>{role.name}</code></td>
                                        <td>{role.description || '-'}</td>
                                        <td>
                                            {role.is_system ? (
                                                <Badge bg="secondary">System</Badge>
                                            ) : (
                                                <Badge bg="info">Custom</Badge>
                                            )}
                                        </td>
                                        <td className="pe-4 text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                <Link
                                                    to={`/roles/edit/${role.id}`}
                                                    className="btn btn-outline-primary btn-sm"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                {!role.is_system && (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(role.id)}
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
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

export default RoleList;
