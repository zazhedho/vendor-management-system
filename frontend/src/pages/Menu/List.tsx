import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Table, Button, Badge, Card, Spinner, Alert, Container } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaBars } from 'react-icons/fa';

interface Menu {
    id: string;
    name: string;
    display_name: string;
    path: string;
    icon: string;
    order_index: number;
    is_active: boolean;
}

const MenuList = () => {
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        try {
            const response = await api.get('/api/menus');
            setMenus(response.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch menus');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this menu?')) return;

        try {
            await api.delete(`/api/menus/${id}`);
            setSuccess('Menu deleted successfully');
            setMenus(menus.filter(m => m.id !== id));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete menu');
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
                <h2 className="fw-bold mb-0">Menu Management</h2>
                <Link to="/menus/create" className="btn btn-primary d-flex align-items-center gap-2">
                    <FaPlus /> Create Menu
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
                                <th className="py-3">Path</th>
                                <th className="py-3">Order</th>
                                <th className="py-3">Status</th>
                                <th className="pe-4 py-3 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {menus.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-5 text-muted">
                                        No menus found.
                                    </td>
                                </tr>
                            ) : (
                                menus.map((menu) => (
                                    <tr key={menu.id}>
                                        <td className="ps-4 fw-medium">
                                            <div className="d-flex align-items-center gap-2">
                                                <FaBars className="text-muted" />
                                                {menu.display_name}
                                            </div>
                                        </td>
                                        <td><code>{menu.name}</code></td>
                                        <td>{menu.path}</td>
                                        <td>{menu.order_index}</td>
                                        <td>
                                            {menu.is_active ? (
                                                <Badge bg="success">Active</Badge>
                                            ) : (
                                                <Badge bg="secondary">Inactive</Badge>
                                            )}
                                        </td>
                                        <td className="pe-4 text-end">
                                            <div className="d-flex justify-content-end gap-2">
                                                <Link
                                                    to={`/menus/edit/${menu.id}`}
                                                    className="btn btn-outline-primary btn-sm"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDelete(menu.id)}
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

export default MenuList;
