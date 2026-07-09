import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';

// Layout Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyReports from './pages/MyReports';
import MyClaims from './pages/MyClaims';  // ✅ Only ONE import
import Admin from './pages/Admin';

// Components
import ItemForm from './components/Items/ItemForm';
import ClaimForm from './components/Claims/ClaimForm';
import ItemDetail from './components/Items/ItemDetail';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Wraps every route so navigating between pages plays a soft fade/rise transition
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-enter w-full">
      <Routes location={location}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Student Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/report-lost" element={
          <ProtectedRoute>
            <ItemForm type="lost" />
          </ProtectedRoute>
        } />
        <Route path="/report-found" element={
          <ProtectedRoute>
            <ItemForm type="found" />
          </ProtectedRoute>
        } />
        <Route path="/my-reports" element={
          <ProtectedRoute>
            <MyReports />
          </ProtectedRoute>
        } />
        <Route path="/my-claims" element={
          <ProtectedRoute>
            <MyClaims />
          </ProtectedRoute>
        } />

        {/* Claim Routes */}
        <Route path="/claim/:itemType/:itemId" element={
          <ProtectedRoute>
            <ClaimForm />
          </ProtectedRoute>
        } />
        <Route path="/claim/:itemId" element={
          <ProtectedRoute>
            <ClaimForm />
          </ProtectedRoute>
        } />
        
        <Route path="/lost-items/:id" element={
          <ProtectedRoute>
            <ItemDetail type="lost" />
          </ProtectedRoute>
        } />

        <Route path="/found-items/:id" element={
          <ProtectedRoute>
            <ItemDetail type="found" />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute adminOnly={true}>
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-ink-50">
          <Navbar />
          <main className="flex-grow w-full px-4 sm:px-6 lg:px-10 py-8 lg:py-10 max-w-[1440px] mx-auto">
            <AnimatedRoutes />
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
