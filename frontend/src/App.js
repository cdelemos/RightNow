import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Layout/Navbar";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./components/Dashboard/Dashboard";

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

// Placeholder components for other routes
const StatuteLookup = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">📚 Statute Lookup</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          The Real-Time Statute Lookup Engine is being built. This will allow you to search 
          legal statutes by state and category with instant results.
        </p>
      </div>
    </div>
  </div>
);

const QuestionsPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">💬 Q&A Community</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          The Community Q&A System is being built. Ask legal questions and get answers 
          from peers and experts.
        </p>
      </div>
    </div>
  </div>
);

const MythsPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">🎯 Legal Myths</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          The Myth-Busting Legal Feed is being built. Discover the truth behind 
          common legal misconceptions.
        </p>
      </div>
    </div>
  </div>
);

const SimulationsPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">🎮 Legal Simulations</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          Scenario-Based Legal Simulations are being built. Practice legal scenarios 
          like police stops and housing disputes in a safe environment.
        </p>
      </div>
    </div>
  </div>
);

const LearningPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">🎓 Learning Paths</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          Advanced Learning Paths are being built. Get personalized curriculum 
          based on your student type and learning goals.
        </p>
      </div>
    </div>
  </div>
);

const AIChatPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">🤖 AI Legal Assistant</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          The AI-Powered Legal Query Assistant is being built. Get instant answers 
          to your legal questions with AI assistance.
        </p>
      </div>
    </div>
  </div>
);

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
                <QuestionsPage />
              </ProtectedRoute>
            } />
            <Route path="/myths" element={
              <ProtectedRoute>
                <MythsPage />
              </ProtectedRoute>
            } />
            <Route path="/simulations" element={
              <ProtectedRoute>
                <SimulationsPage />
              </ProtectedRoute>
            } />
            <Route path="/learning" element={
              <ProtectedRoute>
                <LearningPage />
              </ProtectedRoute>
            } />
            <Route path="/ai-chat" element={
              <ProtectedRoute>
                <AIChatPage />
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
