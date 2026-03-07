import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { MainLayout } from './components/layout';
import AdminLayout from './components/layout/AdminLayout';
import {
  LoginPage,
  RegisterPage,
  Dashboard,
  AccountsList,
  AccountDetail,
  ContactsList,
  ContactDetail,
  LeadsList,
  LeadDetail,
  OpportunitiesList,
  OpportunityDetail,
  ActivitiesList,
  TasksList,
  ReportsPage,
} from './pages';
import {
  OrganizationSettings,
  UserManagement,
  CustomObjects,
  ObjectDetail,
} from './pages/admin';

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<AccountsList />} />
        <Route path="/accounts/:id" element={<AccountDetail />} />
        <Route path="/contacts" element={<ContactsList />} />
        <Route path="/contacts/:id" element={<ContactDetail />} />
        <Route path="/leads" element={<LeadsList />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/opportunities" element={<OpportunitiesList />} />
        <Route path="/opportunities/:id" element={<OpportunityDetail />} />
        <Route path="/activities" element={<ActivitiesList />} />
        <Route path="/tasks" element={<TasksList />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<OrganizationSettings />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="objects" element={<CustomObjects />} />
        <Route path="objects/:id" element={<ObjectDetail />} />
      </Route>

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;