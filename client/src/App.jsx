import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import LandingPage from "./LandingPage";
import Auth from "./Auth";
import Dashboard from "./Dashboard";

function DashboardWrapper({ currentUser }) {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room") || "project-room-1";

  // If the current user is the first to open this room, they become the host
  const isHost = true; // We'll manage actual host approval in MeetingRoom

  return <Dashboard currentUser={currentUser} isHost={isHost} roomId={roomId} />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem("auth") === "true"
  );
  const [showAuth, setShowAuth] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("auth", "true");
    setShowAuth(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("auth");
  };

  const handleShowAuth = () => setShowAuth(true);
  const handleCloseAuth = () => setShowAuth(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage onShowAuth={handleShowAuth} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <DashboardWrapper currentUser="User" />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showAuth && (
        <Auth
          onLogin={handleLogin}
          onClose={handleCloseAuth}
        />
      )}
    </BrowserRouter>
  );
}
