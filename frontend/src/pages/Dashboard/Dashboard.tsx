import { useAuth } from '../../context/AuthContext';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

interface DashboardStats {
    // Admin stats
    totalEvents: number;
    activeEvents: number;
    totalEvaluations: number;
    pendingPayments: number;
    totalVendors: number;
    totalUsers: number;
    // Vendor stats
    myEvaluations: number;
    myPayments: number;
    myPendingPayments: number;
    avgRating: number;
    profileComplete: boolean;
}

interface RecentEvent {
    id: string;
    title: string;
    status: string;
    start_date: string;
    end_date: string;
}

interface RecentPayment {
    id: string;
    amount: number;
    status: string;
    created_at: string;
}

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalEvents: 0,
        activeEvents: 0,
        totalEvaluations: 0,
        pendingPayments: 0,
        totalVendors: 0,
        totalUsers: 0,
        myEvaluations: 0,
        myPayments: 0,
        myPendingPayments: 0,
        avgRating: 0,
        profileComplete: false,
    });
    const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
    const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = ['superadmin', 'admin'].includes(user?.role || '');
    const isVendor = user?.role === 'vendor';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch events
            const eventsRes = await api.get('/api/events', { params: { limit: 5, order_by: 'created_at', order_direction: 'desc' } });
            const eventsData = eventsRes.data.data || [];
            const totalEvents = eventsRes.data.total_data || eventsData.length;
            const activeEvents = eventsData.filter((e: any) => e.status === 'open' || e.status === 'active').length;

            setRecentEvents(eventsData);
            
            // Fetch evaluations count
            let totalEvaluations = 0;
            let myEvaluations = 0;
            let avgRating = 0;
            try {
                const evalRes = await api.get('/api/evaluations', { params: { limit: 100 } });
                const evaluations = evalRes.data.data || [];
                totalEvaluations = evalRes.data.total_data || evaluations.length;
                
                if (isVendor && evaluations.length > 0) {
                    myEvaluations = evaluations.length;
                    const totalRating = evaluations.reduce((sum: number, e: any) => sum + (e.rating || 0), 0);
                    avgRating = myEvaluations > 0 ? totalRating / myEvaluations : 0;
                }
            } catch (e) {
                console.warn('Could not fetch evaluations');
            }

            // Fetch payments
            let pendingPayments = 0;
            let myPayments = 0;
            let myPendingPayments = 0;
            try {
                const payRes = await api.get('/api/payments', { params: { limit: 100 } });
                const payments = payRes.data.data || [];
                pendingPayments = payments.filter((p: any) => p.status === 'pending').length;
                
                if (isVendor) {
                    myPayments = payments.length;
                    myPendingPayments = pendingPayments;
                    setRecentPayments(payments.slice(0, 5));
                }
            } catch (e) {
                console.warn('Could not fetch payments');
            }

            // Fetch vendors count (admin only)
            let totalVendors = 0;
            if (isAdmin) {
                try {
                    const vendorRes = await api.get('/api/vendors', { params: { limit: 1 } });
                    totalVendors = vendorRes.data.total_data || 0;
                } catch (e) {
                    console.warn('Could not fetch vendors');
                }
            }

            // Fetch users count (admin only)
            let totalUsers = 0;
            if (isAdmin) {
                try {
                    const usersRes = await api.get('/api/users', { params: { limit: 1 } });
                    totalUsers = usersRes.data.total_data || 0;
                } catch (e) {
                    console.warn('Could not fetch users');
                }
            }

            // Check vendor profile completion
            let profileComplete = false;
            if (isVendor) {
                try {
                    const profileRes = await api.get('/api/vendor/profile');
                    const profile = profileRes.data.data?.profile;
                    profileComplete = !!(profile?.vendor_name && profile?.email && profile?.npwp_number);
                } catch (e) {
                    console.warn('Could not fetch vendor profile');
                }
            }

            setStats({
                totalEvents,
                activeEvents,
                totalEvaluations,
                pendingPayments,
                totalVendors,
                totalUsers,
                myEvaluations,
                myPayments,
                myPendingPayments,
                avgRating,
                profileComplete,
            });
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const statusColors: { [key: string]: string } = {
            open: 'bg-success',
            active: 'bg-primary',
            closed: 'bg-secondary',
            cancelled: 'bg-danger',
        };
        return statusColors[status] || 'bg-secondary';
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getPaymentStatusBadge = (status: string) => {
        const statusColors: { [key: string]: string } = {
            pending: 'bg-warning',
            paid: 'bg-success',
            cancelled: 'bg-danger',
        };
        return statusColors[status] || 'bg-secondary';
    };

    // Vendor Dashboard
    if (isVendor) {
        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold mb-0">Vendor Dashboard</h2>
                    <button className="btn btn-outline-primary btn-sm" onClick={fetchDashboardData}>
                        <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                    </button>
                </div>

                {/* Profile Completion Alert */}
                {!stats.profileComplete && (
                    <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        <div className="flex-grow-1">
                            Your vendor profile is incomplete. Please complete your profile to participate in events.
                        </div>
                        <Link to="/profile" className="btn btn-warning btn-sm ms-3">
                            Complete Profile
                        </Link>
                    </div>
                )}

                <Row className="g-4 mb-4">
                    <Col md={6} lg={4}>
                        <Card className="h-100 shadow-sm border-0">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="text-muted mb-2">Available Events</h6>
                                        <h3 className="fw-bold text-info mb-1">{stats.activeEvents}</h3>
                                        <p className="text-muted small mb-0">Open for pitching</p>
                                    </div>
                                    <i className="bi bi-calendar-event text-info" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6} lg={4}>
                        <Card className="h-100 shadow-sm border-0">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="text-muted mb-2">My Evaluations</h6>
                                        <h3 className="fw-bold text-success mb-1">{stats.myEvaluations}</h3>
                                        <p className="text-muted small mb-0">
                                            {stats.avgRating > 0 ? `Avg: ${stats.avgRating.toFixed(1)} / 5` : 'No ratings yet'}
                                        </p>
                                    </div>
                                    <i className="bi bi-star-fill text-success" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6} lg={4}>
                        <Card className="h-100 shadow-sm border-0">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="text-muted mb-2">Pending Payments</h6>
                                        <h3 className="fw-bold text-warning mb-1">{stats.myPendingPayments}</h3>
                                        <p className="text-muted small mb-0">of {stats.myPayments} total</p>
                                    </div>
                                    <i className="bi bi-credit-card text-warning" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="g-4">
                    <Col lg={6}>
                        <Card className="shadow-sm border-0 h-100">
                            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">
                                    <i className="bi bi-calendar-event me-2 text-primary"></i>
                                    Available Events
                                </h5>
                                <Link to="/events" className="btn btn-sm btn-outline-primary">
                                    View All
                                </Link>
                            </Card.Header>
                            <Card.Body>
                                {recentEvents.filter(e => e.status === 'open' || e.status === 'active').length > 0 ? (
                                    <div className="list-group list-group-flush">
                                        {recentEvents.filter(e => e.status === 'open' || e.status === 'active').map(event => (
                                            <Link key={event.id} to={`/events/${event.id}`} className="list-group-item list-group-item-action border-0 px-0">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 className="mb-1">{event.title}</h6>
                                                        <small className="text-muted">
                                                            <i className="bi bi-calendar3 me-1"></i>
                                                            {formatDate(event.start_date)} - {formatDate(event.end_date)}
                                                        </small>
                                                    </div>
                                                    <span className={`badge ${getStatusBadge(event.status)}`}>
                                                        {event.status}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted">
                                        <i className="bi bi-calendar-x" style={{ fontSize: '2.5rem' }}></i>
                                        <p className="mt-2 mb-0">No available events at the moment.</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={6}>
                        <Card className="shadow-sm border-0 h-100">
                            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">
                                    <i className="bi bi-credit-card me-2 text-warning"></i>
                                    Recent Payments
                                </h5>
                                <Link to="/payments" className="btn btn-sm btn-outline-primary">
                                    View All
                                </Link>
                            </Card.Header>
                            <Card.Body>
                                {recentPayments.length > 0 ? (
                                    <div className="list-group list-group-flush">
                                        {recentPayments.map(payment => (
                                            <div key={payment.id} className="list-group-item border-0 px-0">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 className="mb-1">{formatCurrency(payment.amount)}</h6>
                                                        <small className="text-muted">
                                                            <i className="bi bi-clock me-1"></i>
                                                            {formatDate(payment.created_at)}
                                                        </small>
                                                    </div>
                                                    <span className={`badge ${getPaymentStatusBadge(payment.status)}`}>
                                                        {payment.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted">
                                        <i className="bi bi-credit-card" style={{ fontSize: '2.5rem' }}></i>
                                        <p className="mt-2 mb-0">No payment history yet.</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    // Admin/Client Dashboard
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Dashboard</h2>
                <button className="btn btn-outline-primary btn-sm" onClick={fetchDashboardData}>
                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                </button>
            </div>

            <Row className="g-4 mb-4">
                <Col md={6} lg={4}>
                    <Card className="h-100 shadow-sm border-0">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="text-muted mb-2">Total Events</h6>
                                    <h3 className="fw-bold text-info mb-1">{stats.totalEvents}</h3>
                                    <p className="text-muted small mb-0">{stats.activeEvents} active</p>
                                </div>
                                <i className="bi bi-calendar-event text-info" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={4}>
                    <Card className="h-100 shadow-sm border-0">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="text-muted mb-2">Evaluations</h6>
                                    <h3 className="fw-bold text-success mb-1">{stats.totalEvaluations}</h3>
                                    <p className="text-muted small mb-0">Total reviews</p>
                                </div>
                                <i className="bi bi-star text-success" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={4}>
                    <Card className="h-100 shadow-sm border-0">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className="text-muted mb-2">Pending Payments</h6>
                                    <h3 className="fw-bold text-warning mb-1">{stats.pendingPayments}</h3>
                                    <p className="text-muted small mb-0">Requires attention</p>
                                </div>
                                <i className="bi bi-credit-card text-warning" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {isAdmin && (
                    <>
                        <Col md={6} lg={4}>
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h6 className="text-muted mb-2">Total Vendors</h6>
                                            <h3 className="fw-bold text-primary mb-1">{stats.totalVendors}</h3>
                                            <p className="text-muted small mb-0">Registered vendors</p>
                                        </div>
                                        <i className="bi bi-building text-primary" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6} lg={4}>
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h6 className="text-muted mb-2">Total Users</h6>
                                            <h3 className="fw-bold text-secondary mb-1">{stats.totalUsers}</h3>
                                            <p className="text-muted small mb-0">System users</p>
                                        </div>
                                        <i className="bi bi-people text-secondary" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </>
                )}
            </Row>

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0">
                        <i className="bi bi-calendar-event me-2 text-primary"></i>
                        Recent Events
                    </h5>
                    <Link to="/events" className="btn btn-sm btn-outline-primary">
                        View All
                    </Link>
                </Card.Header>
                <Card.Body>
                    {recentEvents.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentEvents.map(event => (
                                        <tr key={event.id}>
                                            <td>
                                                <Link to={`/events/${event.id}`} className="text-decoration-none">
                                                    {event.title}
                                                </Link>
                                            </td>
                                            <td>{formatDate(event.start_date)}</td>
                                            <td>{formatDate(event.end_date)}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(event.status)}`}>
                                                    {event.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-calendar-x" style={{ fontSize: '3rem' }}></i>
                            <p className="mt-2 mb-0">No recent events to display.</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default Dashboard;
