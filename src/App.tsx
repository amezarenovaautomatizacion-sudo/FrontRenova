import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import Empleados from './pages/Empleados';
import Solicitudes from './pages/Solicitudes';
import Proyectos from './pages/Proyectos';
import Notificaciones from './pages/Notificaciones';
import Aprobadores from './pages/Aprobadores';
import Incidencias from './pages/Incidencias';
import ReportesEstadisticas from './pages/Reportes';
import './index.css';


// 🔥 Componente interno para poder usar useAuth
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // aquí puedes poner un spinner si quieres

  return (
    <Routes>
      {/* Login */}
      <Route 
        path="/login" 
        element={
          isAuthenticated 
            ? <Navigate to="/dashboard" replace /> 
            : <Login />
        } 
      />

      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="empleados" element={<Empleados />} />
        <Route path="solicitudes" element={<Solicitudes />} />
        <Route path="proyectos" element={<Proyectos />} />
        <Route path="notificaciones" element={<Notificaciones />} />
        <Route path="aprobadores" element={<Aprobadores />} />
        <Route path="incidencias" element={<Incidencias />} />
        <Route path="reportes" element={<ReportesEstadisticas />} />
      </Route>

      {/* Ruta comodín */}
      <Route 
        path="*" 
        element={
          isAuthenticated 
            ? <Navigate to="/dashboard" replace /> 
            : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;