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
const QuestionsPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-sage-800 mb-8 flex items-center">
        <span className="animate-float inline-block mr-4">💬</span>
        Q&A Community
      </h1>
      <div className="bg-white rounded-3xl shadow-sage-lg p-12 text-center border border-sage-100">
        <div className="text-8xl mb-6 animate-bounce-soft">🚧</div>
        <h2 className="text-3xl font-bold text-sage-800 mb-4">Building Our Community!</h2>
        <p className="text-sage-600 text-lg max-w-2xl mx-auto leading-relaxed">
          The Community Q&A System is in development. Connect with fellow legal learners, 
          ask questions, and get expert answers! 🤝
        </p>
        <div className="mt-8 bg-sage-50 rounded-2xl p-6">
          <div className="text-sage-700 font-medium mb-2">🎯 What's Coming:</div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-sage-600">
            <div>• Peer-to-peer discussions</div>
            <div>• Expert moderation</div>
            <div>• Voting system</div>
            <div>• Achievement rewards</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);



const SimulationsPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-sage-800 mb-8 flex items-center">
        <span className="animate-float inline-block mr-4">🎮</span>
        Legal Simulations
      </h1>
      <div className="bg-white rounded-3xl shadow-sage-lg p-12 text-center border border-sage-100">
        <div className="text-8xl mb-6 animate-bounce-soft">🚧</div>
        <h2 className="text-3xl font-bold text-sage-800 mb-4">Game-Changing Learning!</h2>
        <p className="text-sage-600 text-lg max-w-2xl mx-auto leading-relaxed">
          Scenario-Based Legal Simulations are in the works! Practice real-world situations 
          like police encounters and housing disputes in a safe, gamified environment! 🛡️
        </p>
        <div className="mt-8 bg-sage-50 rounded-2xl p-6">
          <div className="text-sage-700 font-medium mb-2">🎯 What's Coming:</div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-sage-600">
            <div>• Interactive scenarios</div>
            <div>• Branching storylines</div>
            <div>• Safe practice environment</div>
            <div>• Performance feedback</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LearningPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-sage-800 mb-8 flex items-center">
        <span className="animate-float inline-block mr-4">🎓</span>
        Learning Paths
      </h1>
      <div className="bg-white rounded-3xl shadow-sage-lg p-12 text-center border border-sage-100">
        <div className="text-8xl mb-6 animate-bounce-soft">🚧</div>
        <h2 className="text-3xl font-bold text-sage-800 mb-4">Personalized Journeys!</h2>
        <p className="text-sage-600 text-lg max-w-2xl mx-auto leading-relaxed">
          Advanced Learning Paths are being tailored just for you! Get personalized curriculum 
          based on your student type and learning goals! 🎯📈
        </p>
        <div className="mt-8 bg-sage-50 rounded-2xl p-6">
          <div className="text-sage-700 font-medium mb-2">🎯 What's Coming:</div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-sage-600">
            <div>• Personalized curriculum</div>
            <div>• Adaptive learning</div>
            <div>• Progress tracking</div>
            <div>• Achievement system</div>
          </div>
        </div>
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
                <MythFeed />
              </ProtectedRoute>
            } />
            <Route path="/simulations" element={
              <ProtectedRoute>
                <SimulationPlayer />
              </ProtectedRoute>
            } />
            <Route path="/learning" element={
              <ProtectedRoute>
                <LearningPage />
              </ProtectedRoute>
            } />
            <Route path="/ai-chat" element={
              <ProtectedRoute>
                <AIChat />
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
