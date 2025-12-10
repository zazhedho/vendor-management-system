import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui';

// Auth pages - not lazy loaded for faster initial load
import { Login, Register, ForgotPassword, ResetPassword, ChangePassword } from './pages/auth';

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));

// Events
const EventList = lazy(() => import('./pages/events').then(m => ({ default: m.EventList })));
const EventForm = lazy(() => import('./pages/events').then(m => ({ default: m.EventForm })));
const EventDetail = lazy(() => import('./pages/events').then(m => ({ default: m.EventDetail })));

// Vendors
const VendorList = lazy(() => import('./pages/vendors').then(m => ({ default: m.VendorList })));
const VendorForm = lazy(() => import('./pages/vendors').then(m => ({ default: m.VendorForm })));
const VendorDetail = lazy(() => import('./pages/vendors').then(m => ({ default: m.VendorDetail })));
const VendorProfile = lazy(() => import('./pages/vendors').then(m => ({ default: m.VendorProfile })));
const VendorDocuments = lazy(() => import('./pages/vendors').then(m => ({ default: m.VendorDocuments })));
const VendorProfileRedirect = lazy(() => import('./pages/vendors').then(m => ({ default: m.VendorProfileRedirect })));

// Payments
const PaymentList = lazy(() => import('./pages/payments').then(m => ({ default: m.PaymentList })));
const PaymentDetail = lazy(() => import('./pages/payments').then(m => ({ default: m.PaymentDetail })));
const PaymentForm = lazy(() => import('./pages/payments').then(m => ({ default: m.PaymentForm })));

// Evaluations
const EvaluationList = lazy(() => import('./pages/evaluations').then(m => ({ default: m.EvaluationList })));
const EvaluationDetail = lazy(() => import('./pages/evaluations').then(m => ({ default: m.EvaluationDetail })));
const EvaluationForm = lazy(() => import('./pages/evaluations').then(m => ({ default: m.EvaluationForm })));
const VendorPhotoUpload = lazy(() => import('./pages/evaluations').then(m => ({ default: m.VendorPhotoUpload })));

// Submissions
const SubmissionList = lazy(() => import('./pages/submissions').then(m => ({ default: m.SubmissionList })));

// Users
const UserList = lazy(() => import('./pages/users').then(m => ({ default: m.UserList })));
const UserForm = lazy(() => import('./pages/users').then(m => ({ default: m.UserForm })));
const Profile = lazy(() => import('./pages/users').then(m => ({ default: m.Profile })));

// Roles
const RoleList = lazy(() => import('./pages/roles').then(m => ({ default: m.RoleList })));
const RoleForm = lazy(() => import('./pages/roles').then(m => ({ default: m.RoleForm })));

// Menus
const MenuList = lazy(() => import('./pages/menus').then(m => ({ default: m.MenuList })));
const MenuForm = lazy(() => import('./pages/menus').then(m => ({ default: m.MenuForm })));

// Sessions
const SessionList = lazy(() => import('./pages/sessions').then(m => ({ default: m.SessionList })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Spinner size="lg" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute resource="event" action="list">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <EventList />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/new"
            element={
              <ProtectedRoute resource="event" action="create">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <EventForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute resource="event" action="view">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <EventDetail />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/edit"
            element={
              <ProtectedRoute resource="event" action="update">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <EventForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vendors"
            element={
              <ProtectedRoute resource="vendor" action="list">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorList />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors/new"
            element={
              <ProtectedRoute resource="vendor" action="update">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors/:id"
            element={
              <ProtectedRoute resource="vendor" action="view">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorDetail />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors/:id/edit"
            element={
              <ProtectedRoute resource="vendor" action="update">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedRoute resource="payment" action="list">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <PaymentList />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/new"
            element={
              <ProtectedRoute resource="payment" action="create">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <PaymentForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/:id"
            element={
              <ProtectedRoute resource="payment" action="view">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <PaymentDetail />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/:id/edit"
            element={
              <ProtectedRoute resource="payment" action="update">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <PaymentForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/evaluations"
            element={
              <ProtectedRoute resource="evaluation" action="list">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <EvaluationList />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluations/new"
            element={
              <ProtectedRoute resource="evaluation" action="create">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <EvaluationForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluations/:id"
            element={
              <ProtectedRoute resource="evaluation" action="view">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <EvaluationDetail />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluations/:id/edit"
            element={
              <ProtectedRoute resource="evaluation" action="update">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <EvaluationForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluations/:id/upload"
            element={
              <ProtectedRoute resource="evaluation" action="upload_photo">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorPhotoUpload />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute resource="users" action="list">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <UserList />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/new"
            element={
              <ProtectedRoute resource="users" action="create">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <UserForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <ProtectedRoute resource="users" action="update">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <UserForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/roles"
            element={
              <ProtectedRoute resource="roles" action="list">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <RoleList />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles/new"
            element={
              <ProtectedRoute resource="roles" action="create">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <RoleForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles/:id/edit"
            element={
              <ProtectedRoute resource="roles" action="update">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <RoleForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/menus"
            element={
              <ProtectedRoute resource="menus" action="list">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <MenuList />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/menus/new"
            element={
              <ProtectedRoute resource="menus" action="create">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <MenuForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/menus/:id/edit"
            element={
              <ProtectedRoute resource="menus" action="update">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <MenuForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <Profile />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <SessionList />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Vendor Profile Routes */}
          <Route
            path="/vendor/profile"
            element={
              <ProtectedRoute resource="vendor" action="view">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorProfileRedirect />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/detail"
            element={
              <ProtectedRoute resource="vendor" action="view">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorProfile />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/edit"
            element={
              <ProtectedRoute resource="vendor" action="update">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/:id/detail"
            element={
              <ProtectedRoute resource="vendor" action="view">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorDetail />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/new"
            element={
              <ProtectedRoute resource="vendor" action="update">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/documents"
            element={
              <ProtectedRoute resource="vendor" action="view">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorDocuments />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/:id/edit"
            element={
              <ProtectedRoute resource="vendor" action="update">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorForm />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Submission Routes */}
          <Route
            path="/submissions"
            element={
              <ProtectedRoute resource="event" action="list_submissions">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <SubmissionList />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/submissions"
            element={
              <ProtectedRoute resource="event" action="view_my_submissions">
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <SubmissionList />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
