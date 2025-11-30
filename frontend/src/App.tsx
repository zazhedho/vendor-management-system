import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login, Register, ForgotPassword, ResetPassword, ChangePassword } from './pages/auth';
import { Dashboard } from './pages/Dashboard';
import { EventList, EventForm, EventDetail } from './pages/events';
import { VendorList, VendorForm, VendorDetail, VendorProfile } from './pages/vendors';
import { PaymentList, PaymentDetail, PaymentForm } from './pages/payments';
import { EvaluationList, EvaluationDetail, EvaluationForm, VendorPhotoUpload } from './pages/evaluations';
import { SubmissionList } from './pages/submissions';
import { UserList, UserForm, Profile } from './pages/users';
import { RoleList, RoleForm } from './pages/roles';
import { MenuList, MenuForm } from './pages/menus';
import { SessionList } from './pages/sessions';

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
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Layout>
                  <EventList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <EventForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <EventDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <EventForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vendors"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <PaymentForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/evaluations"
            element={
              <ProtectedRoute>
                <Layout>
                  <EvaluationList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluations/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <EvaluationForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluations/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <EvaluationDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluations/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <EvaluationForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluations/:id/upload"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorPhotoUpload />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <UserForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/menus"
            element={
              <ProtectedRoute>
                <Layout>
                  <MenuList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/menus/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <MenuForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/menus/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <MenuForm />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <Layout>
                  <SessionList />
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
                  <VendorProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/detail"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/:id/detail"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/profile/:id/edit"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorProfile />
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
                  <SubmissionList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/submissions"
            element={
              <ProtectedRoute>
                <Layout>
                  <SubmissionList />
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
