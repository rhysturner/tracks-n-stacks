import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StreamsPage from './pages/StreamsPage';
import StreamViewPage from './pages/StreamViewPage';
import MixesPage from './pages/MixesPage';
import MixViewPage from './pages/MixViewPage';
import DJProfilePage from './pages/DJProfilePage';
import DJsPage from './pages/DJsPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#666' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f0f' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/streams" element={<StreamsPage />} />
          <Route path="/streams/:id" element={<StreamViewPage />} />
          <Route path="/mixes" element={<MixesPage />} />
          <Route path="/mixes/:id" element={<MixViewPage />} />
          <Route path="/djs" element={<DJsPage />} />
          <Route path="/dj/:username" element={<DJProfilePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

