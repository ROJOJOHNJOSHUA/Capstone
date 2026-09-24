import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { GuestRoute } from './routes/GuestRoute';
import { UserRoute } from './routes/UserRoute';
import { AdminRoute } from './routes/AdminRoute';
import { AuthenticatedRoute } from './routes/AuthenticatedRoute';
import { testConnection } from './services/api';

// Public pages
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';

// Auth pages (guest-only)
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Parishioner (user-role) pages
import Dashboard from './pages/Dashboard';
import MakeRequest from './pages/MakeRequest';
import Reservation from './pages/Reservation';
import Appointment from './pages/Appointment';

// Shared authenticated pages (any role)
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminReservations from './pages/admin/AdminReservations';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminRecords from './pages/admin/AdminRecords';
import AdminUsers from './pages/admin/AdminUsers';
import Reports from './pages/admin/Reports';
import SMSLogs from './pages/admin/SMSLogs';
import ParishCalendar from './pages/admin/ParishCalendar';
import SystemLogs from './pages/admin/SystemLogs';

// Error / access pages
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

function LoginWelcomeAlert() {
  const { welcomeMessage, dismissWelcome } = useAuth();

  useEffect(() => {
    if (!welcomeMessage) return undefined;
    const timeout = window.setTimeout(dismissWelcome, 6000);
    return () => window.clearTimeout(timeout);
  }, [welcomeMessage, dismissWelcome]);

  if (!welcomeMessage) return null;

  return (
    <div className="fixed left-1/2 top-24 z-[300] flex w-[min(25rem,calc(100vw-2rem))] -translate-x-1/2 items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-[0_18px_40px_rgba(15,31,45,0.18)]" role="status" aria-live="polite">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white" aria-hidden="true">✓</span>
      <p className="flex-1 text-sm font-semibold">{welcomeMessage} You have successfully logged in.</p>
      <button type="button" onClick={dismissWelcome} className="text-lg leading-none text-emerald-700/70 transition hover:text-emerald-900" aria-label="Dismiss welcome message">×</button>
    </div>
  );
}

function LocalDevelopmentDiagnostics() {
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    console.info('=================================');
    console.info('LOCAL DEVELOPMENT MODE');
    console.info('Frontend: http://localhost:5173');
    console.info('API: /api -> local PHP server');
    console.info('=================================');

    testConnection()
      .then((response) => {
        const health = response?.data ?? response;
        console.info('[LOCAL CONNECTION]', {
          Frontend: 'OK',
          Backend: health?.backend || 'unknown',
          Database: health?.database_name || 'unknown',
          MySQL: health?.database || 'unknown',
        });
      })
      .catch((error) => {
        console.error('[LOCAL CONNECTION]', {
          Frontend: 'OK',
          Backend: 'FAILED or unreachable',
          Database: 'not checked',
          MySQL: error.message || 'not checked',
        });
      });
    return undefined;
  }, []);

  return <div className="fixed bottom-3 left-3 z-[400] rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-900 shadow">Local Dev</div>;
}

export default function App() {
  return (
    <>
      <LocalDevelopmentDiagnostics />
      <LoginWelcomeAlert />
      <Routes>
      <Route
        path="/"
        element={
          <GuestRoute>
            <Home />
          </GuestRoute>
        }
      />
      <Route path="/services" element={<Services />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <UserRoute>
            <Dashboard />
          </UserRoute>
        }
      />
      <Route
        path="/make-request"
        element={
          <UserRoute>
            <MakeRequest />
          </UserRoute>
        }
      />
      <Route
        path="/reservations"
        element={
          <UserRoute>
            <Reservation />
          </UserRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <UserRoute>
            <Appointment />
          </UserRoute>
        }
      />

      {/* ── Shared authenticated routes (any role) ─────────────────── */}
      <Route
        path="/profile"
        element={
          <AuthenticatedRoute>
            <Profile />
          </AuthenticatedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <AuthenticatedRoute>
            <Notifications />
          </AuthenticatedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthenticatedRoute>
            <Settings />
          </AuthenticatedRoute>
        }
      />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reservations"
        element={
          <AdminRoute>
            <AdminReservations />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/parish-calendar"
        element={
          <AdminRoute>
            <ParishCalendar />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/appointments"
        element={
          <AdminRoute>
            <AdminAppointments />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/records"
        element={
          <AdminRoute>
            <AdminRecords />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/sms-logs"
        element={
          <AdminRoute>
            <SMSLogs />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/system-logs"
        element={
          <AdminRoute>
            <SystemLogs />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminRoute>
            <Reports />
          </AdminRoute>
        }
      />

      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
