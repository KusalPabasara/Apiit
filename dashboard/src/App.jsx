import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI } from './services/api';
import socketService from './services/socket';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function ProtectedRoute({ children }) {
  if (!authAPI.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [isAuth, setIsAuth] = useState(authAPI.isAuthenticated());

  useEffect(() => {
    // Connect socket when authenticated
    if (isAuth) {
      socketService.connect();
    }
    
    return () => {
      if (!isAuth) {
        socketService.disconnect();
      }
    };
  }, [isAuth]);

  return (
    <BrowserRouter basename="/dashboard" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuth 
              ? <Navigate to="/" replace /> 
              : <LoginPage onLogin={() => setIsAuth(true)} />
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardPage onLogout={() => setIsAuth(false)} />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
