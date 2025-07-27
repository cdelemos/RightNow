import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GamificationProvider } from "./context/GamificationContext";
import { UnlockProvider } from "./context/UnlockContext";
import BookContainer from "./components/Book/BookContainer";
import DailyLearning from "./components/Book/DailyLearning";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import StatuteLookup from "./components/Statutes/StatuteLookup";
import AIChat from "./components/AI/AIChat";
import MythFeed from "./components/Myths/MythFeed";
import SimulationPlayer from "./components/Simulations/SimulationPlayer";
import CommunityQA from "./components/Community/CommunityQA";
import LearningPaths from "./components/Learning/LearningPaths";
import EmergencySOS from "./components/Emergency/EmergencySOS";
import EmergencyContacts from "./components/Emergency/EmergencyContacts";
import GamificationDashboard from "./components/Gamification/GamificationDashboard";
import GamificationWidget from "./components/Gamification/GamificationWidget";
import MascotWidget from "./components/Mascot/MascotWidget";
import TrophyWall from "./components/Unlocks/TrophyWall";
import AboutUs from "./components/About/AboutUs";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-book-leather via-forest-900 to-book-leather flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-gold-600"></div>
          <p className="mt-4 text-gold-200">Loading your legal journey...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-book-leather via-forest-900 to-book-leather flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-gold-600"></div>
          <p className="mt-4 text-gold-200">Loading...</p>
        </div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

// Public Access Route Component (accessible to everyone)
const PublicAccessRoute = ({ children }) => {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-book-leather via-forest-900 to-book-leather flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-gold-600"></div>
          <p className="mt-4 text-gold-200">Loading...</p>
        </div>
      </div>
    );
  }
  
  return children;
};

// Placeholder components for other routes with sage green theme









function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public About Us page - outside AuthProvider to avoid auth checks */}
          <Route path="/about" element={<AboutUs />} />
          
          {/* All other routes wrapped in AuthProvider */}
          <Route path="/*" element={
            <AuthProvider>
              <GamificationProvider>
                <UnlockProvider>
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
                    
                    {/* Protected routes wrapped in BookContainer */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <BookContainer>
                          <DailyLearning />
                        </BookContainer>
                      </ProtectedRoute>
                    } />
                    <Route path="/statutes" element={
                      <ProtectedRoute>
                        <BookContainer>
                          <StatuteLookup />
                        </BookContainer>
                      </ProtectedRoute>
                    } />
                    <Route path="/questions" element={
                      <ProtectedRoute>
                        <BookContainer>
                          <CommunityQA />
                        </BookContainer>
                      </ProtectedRoute>
                    } />
                    <Route path="/myths" element={
                      <ProtectedRoute>
                        <BookContainer>
                          <MythFeed />
                        </BookContainer>
                      </ProtectedRoute>
                    } />
                    <Route path="/simulations" element={
                      <ProtectedRoute>
                        <BookContainer>
                          <SimulationPlayer />
                        </BookContainer>
                      </ProtectedRoute>
                    } />
                    <Route path="/learning-paths" element={
                      <ProtectedRoute>
                        <BookContainer>
                          <LearningPaths />
                        </BookContainer>
                      </ProtectedRoute>
                    } />
                    <Route path="/ai-chat" element={
                      <ProtectedRoute>
                        <BookContainer>
                          <AIChat />
                        </BookContainer>
                      </ProtectedRoute>
                    } />
                    <Route path="/emergency-contacts" element={
                      <ProtectedRoute>
                        <BookContainer>
                          <EmergencyContacts />
                        </BookContainer>
                      </ProtectedRoute>
                    } />
                    <Route path="/gamification" element={
                      <ProtectedRoute>
                        <BookContainer>
                          <GamificationDashboard />
                        </BookContainer>
                      </ProtectedRoute>
                    } />
                    <Route path="/trophy-wall" element={
                      <ProtectedRoute>
                        <BookContainer>
                          <TrophyWall />
                        </BookContainer>
                      </ProtectedRoute>
                    } />
                    
                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                  </Routes>
                  
                  {/* Always-visible widgets when authenticated */}
                  <ProtectedRoute>
                    <EmergencySOS />
                  </ProtectedRoute>
                  
                  <ProtectedRoute>
                    <GamificationWidget position="top-right" />
                  </ProtectedRoute>
                  
                  <ProtectedRoute>
                    <MascotWidget position="bottom-left" />
                  </ProtectedRoute>
                </UnlockProvider>
              </GamificationProvider>
            </AuthProvider>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
