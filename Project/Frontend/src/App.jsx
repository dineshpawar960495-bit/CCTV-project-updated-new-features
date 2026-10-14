import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import Register from './components/Register'; // <-- Import Register
import Dashboard from './components/Dashboard';
import FeedPreview from './components/FeedPreview';
import ManageCameras from './components/ManageCameras';
import ThreatIntelligence from './components/ThreatIntelligence';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* <-- Add Route */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/preview" element={<FeedPreview />} />
        <Route path="/manage-cameras" element={<ManageCameras />} />
        <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
      </Routes>
    </Router>
  );
}

export default App;