import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DepartmentSelectionModal from './components/common/DepartmentSelectionModal';
import { FaMoon, FaSun } from 'react-icons/fa';

// Pages
import Welcome from './pages/Welcome';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './pages/ForgotPassword';

// Dashboards
import InternDashboard from './components/dashboard/InternDashboard';
import HRDashboard from './components/dashboard/HRDashboard';
import HODDashboard from './components/dashboard/HODDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import COSPSDashboard from './components/dashboard/COSPSDashboard';
import AnalyticsDashboard from './components/dashboard/AnalyticsDashboard';

// ====================================================
// 🔒 Protected Route Component
// ====================================================
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// ====================================================
// 🧭 Dashboard Router Component (includes Admin)
// ====================================================
const DashboardRouter = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/" />;
  }

  switch (user.role) {
    case 'intern':
    case 'attachee':
      return <InternDashboard />;
    case 'hr':
      return <HRDashboard />;
    case 'hod':
      return <HODDashboard />;
    case 'chief_of_staff':
    case 'principal_secretary':
      return <COSPSDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/" />;
  }
};

// ====================================================
// 🌐 Navbar Component
// ====================================================
const Navbar = () => {
  const { user, logoutUser } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md transition-colors duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-12 w-12 object-contain"
              onError={(e) => {
                e.target.src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%233b82f6" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40" font-weight="bold">IMS</text></svg>';
              }}
            />
            <div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
                Office of the Prime Cabinet Secretary
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Ministry of Foreign Affairs - Parliamentary Affairs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {(user.role === 'hr' || user.role === 'hod' || user.role === 'admin' || user.role === 'chief_of_staff' || user.role === 'principal_secretary') && (
              <Link
                to="/analytics"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium"
              >
                Analytics
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {theme === 'dark' ? (
                <FaSun className="text-yellow-400 text-lg" />
              ) : (
                <FaMoon className="text-gray-700 text-lg" />
              )}
            </button>

            <span className="text-gray-600 dark:text-gray-300 text-sm">
              {user.fullName} ({user.role.toUpperCase()})
            </span>

            <button
              onClick={logoutUser}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// ====================================================
// ⚙️ App Content
// ====================================================
function AppContent() {
  const { user, checkAuth } = useContext(AuthContext);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'chief_of_staff' && user.role !== 'principal_secretary') {
      if (!user.department || !user.subdepartment) {
        setShowDepartmentModal(true);
      }
    }
  }, [user]);

  const handleDepartmentSet = async () => {
    setShowDepartmentModal(false);
    await checkAuth(); // Refresh user data
  };

  return (
    <>
      <Navbar />
      {showDepartmentModal && (
        <DepartmentSelectionModal user={user} onComplete={handleDepartmentSet} />
      )}

      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/register/:role" element={<Register />} />
        <Route path="/forgot-password/:role" element={<ForgotPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hod', 'admin', 'chief_of_staff', 'principal_secretary']}>
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

// ====================================================
// 🚀 Main App Wrapper
// ====================================================
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
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
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;