import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Table, Button, Badge, Card, Spinner, Alert, Container } from 'react-bootstrap';
import { FaEdit, FaTrash, FaUserPlus } from 'react-icons/fa';

interface User {
    id: string;
    name: string;
    email: string;
    role_name: string;
    phone: string;
    created_at: string;
}

const UserList = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/users');
            setUsers(response.data.data.items || []); // Adjust based on pagination response structure
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await api.delete(`/api/user/${id}`);
            setSuccess('User deleted successfully');
            setUsers(users.filter(u => u.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'superadmin': return <Badge bg="danger">Super Admin</Badge>;
            case 'admin': return <Badge bg="warning" text="dark">Admin</Badge>;
            case 'vendor': return <Badge bg="info">Vendor</Badge>;
            case 'client': return <Badge bg="success">Client</Badge>;
            default: return <Badge bg="secondary">{role}</Badge>;
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
                <h2 className="fw-bold mb-0">User Management</h2>
                <Link to="/users/create" className="btn btn-primary d-flex align-items-center gap-2">
                    <FaUserPlus /> Add User
                </Link>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4 py-3">Name</th>
                                <th className="py-3">Email</th>
                                <th className="py-3">Role</th>
                                <th className="py-3">Phone</th>
                                <th className="py-3">Joined Date</th>
                                <th className="pe-4 py-3 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-5 text-muted">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="ps-4 fw-medium">{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{getRoleBadge(user.role_name)}</td>
                                        <td>{user.phone || '-'}</td>
                                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="pe-4 text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                <Link
                                                    to={`/users/edit/${user.id}`}
                                                    className="btn btn-outline-primary btn-sm"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(user.id)}
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
        </Container>
    );
};

export default UserList;
