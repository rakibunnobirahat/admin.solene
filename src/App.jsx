import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Adminpage from './pages/Adminpage';
import BookingDetailsPage from './pages/BookingDetailsPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Adminpage />} />
      <Route path="/booking/:id" element={<BookingDetailsPage />} />
    </Routes>
  )
}

export default App