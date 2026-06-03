import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import { LoginPage, RegisterPage } from './pages/Auth';
import Write from './pages/Write';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/post/:slug" element={<PostDetail />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/write" element={<PrivateRoute><Write /></PrivateRoute>} />
          <Route path="/edit/:id" element={<PrivateRoute><Write /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: 'var(--font-body)', background: 'var(--ink)', color: '#fff' } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
