import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Adminpage from './pages/Adminpage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Hidden — not linked anywhere; gated server-side by ADMIN_SETUP_KEY */}
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Adminpage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking/:id"
        element={
          <ProtectedRoute>
            <BookingDetailsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
