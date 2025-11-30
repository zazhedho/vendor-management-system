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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
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
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorProfile />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/detail"
            element={
              <ProtectedRoute>
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
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorProfile />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/:id/detail"
            element={
              <ProtectedRoute>
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
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorProfile />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <VendorProfile />
                  </Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Submission Routes */}
          <Route
            path="/submissions"
            element={
              <ProtectedRoute>
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
              <ProtectedRoute>
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
