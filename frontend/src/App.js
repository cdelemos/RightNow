import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Layout/Navbar";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./components/Dashboard/Dashboard";
import StatuteLookup from "./components/Statutes/StatuteLookup";
import AIChat from "./components/AI/AIChat";
import MythFeed from "./components/Myths/MythFeed";
import SimulationPlayer from "./components/Simulations/SimulationPlayer";
import CommunityQA from "./components/Community/CommunityQA";
import LearningPaths from "./components/Learning/LearningPaths";
import EmergencySOS from "./components/Emergency/EmergencySOS";
import EmergencyContacts from "./components/Emergency/EmergencyContacts";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

// Placeholder components for other routes with sage green theme









function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/statutes" element={
              <ProtectedRoute>
                <StatuteLookup />
              </ProtectedRoute>
            } />
            <Route path="/questions" element={
              <ProtectedRoute>
                <CommunityQA />
              </ProtectedRoute>
            } />
            <Route path="/myths" element={
              <ProtectedRoute>
                <MythFeed />
              </ProtectedRoute>
            } />
            <Route path="/simulations" element={
              <ProtectedRoute>
                <SimulationPlayer />
              </ProtectedRoute>
            } />
            <Route path="/learning-paths" element={
              <ProtectedRoute>
                <LearningPaths />
              </ProtectedRoute>
            } />
            <Route path="/ai-chat" element={
              <ProtectedRoute>
                <AIChat />
              </ProtectedRoute>
            } />
            <Route path="/emergency-contacts" element={
              <ProtectedRoute>
                <EmergencyContacts />
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
          
          {/* Emergency SOS - Always available when authenticated */}
          <ProtectedRoute>
            <EmergencySOS />
          </ProtectedRoute>
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
