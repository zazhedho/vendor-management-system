import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { Suspense, lazy } from 'react';
import { Spinner } from 'react-bootstrap';

// Lazy load components
const Login = lazy(() => import('../pages/Auth/Login'));
const Register = lazy(() => import('../pages/Auth/Register'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const VendorProfile = lazy(() => import('../pages/Vendors/Profile'));
const VendorList = lazy(() => import('../pages/Vendors/List'));
const EventList = lazy(() => import('../pages/Event/List'));
const EventDetail = lazy(() => import('../pages/Event/Detail'));
const EventForm = lazy(() => import('../pages/Event/Form'));
const PaymentList = lazy(() => import('../pages/Payment/List'));
const PaymentForm = lazy(() => import('../pages/Payment/Form'));
const EvaluationList = lazy(() => import('../pages/Evaluation/List'));
const EvaluationForm = lazy(() => import('../pages/Evaluation/Form'));
const UserList = lazy(() => import('../pages/User/List'));
const UserForm = lazy(() => import('../pages/User/Form'));
const UserProfile = lazy(() => import('../pages/User/Profile'));
const RoleList = lazy(() => import('../pages/Role/List'));
const RoleForm = lazy(() => import('../pages/Role/Form'));
const MenuList = lazy(() => import('../pages/Menu/List'));
const MenuForm = lazy(() => import('../pages/Menu/Form'));

const LoadingFallback = () => (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
    </div>
);

const Unauthorized = () => (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center">
            <h1 className="display-1 fw-bold text-primary mb-3">403</h1>
            <p className="lead text-secondary">Unauthorized Access</p>
        </div>
    </div>
);

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingFallback />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role || '')) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

const AppRoutes = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        
                        {/* User Profile - Available for all authenticated users */}
                        <Route path="/user-profile" element={<UserProfile />} />

                        {/* Vendor Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['vendor']} />}>
                            <Route path="/profile" element={<VendorProfile />} />
                        </Route>

                        {/* Admin Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin']} />}>
                            <Route path="/vendors" element={<VendorList />} />
                            <Route path="/users" element={<UserList />} />
                            <Route path="/users/create" element={<UserForm />} />
                            <Route path="/users/edit/:id" element={<UserForm />} />

                            {/* Role Management */}
                            <Route path="/roles" element={<RoleList />} />
                            <Route path="/roles/create" element={<RoleForm />} />
                            <Route path="/roles/edit/:id" element={<RoleForm />} />

                            {/* Menu Management */}
                            <Route path="/menus" element={<MenuList />} />
                            <Route path="/menus/create" element={<MenuForm />} />
                            <Route path="/menus/edit/:id" element={<MenuForm />} />

                            {/* Event Management (Admin) */}
                            <Route path="/events/create" element={<EventForm />} />
                            <Route path="/events/edit/:id" element={<EventForm />} />

                            {/* Payment Management (Admin) */}
                            <Route path="/payments/create" element={<PaymentForm />} />
                            <Route path="/payments/edit/:id" element={<PaymentForm />} />
                        </Route>

                        {/* Payment Routes (Vendor/Admin) */}
                        <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'vendor']} />}>
                            <Route path="/payments" element={<PaymentList />} />
                        </Route>

                        {/* Evaluation Routes (Admin/Client/Vendor) */}
                        <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'client', 'vendor']} />}>
                            <Route path="/evaluations" element={<EvaluationList />} />
                        </Route>

                        {/* Evaluation Management (Admin/Client) */}
                        <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'client']} />}>
                            <Route path="/evaluations/create" element={<EvaluationForm />} />
                            <Route path="/evaluations/edit/:id" element={<EvaluationForm />} />
                        </Route>

                        {/* Event Routes (Public/Vendor) */}
                        <Route path="/events" element={<EventList />} />
                        <Route path="/events/:id" element={<EventDetail />} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
