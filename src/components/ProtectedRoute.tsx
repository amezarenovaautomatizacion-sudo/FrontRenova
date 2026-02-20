import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - Evaluando:', {
    path: location.pathname,
    isAuthenticated,
    isLoading
  });

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    console.log('Usuario no autenticado, redirigiendo a login desde:', location.pathname);
    
    // Guardar en sessionStorage SIEMPRE
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    console.log('Ruta guardada en sessionStorage:', location.pathname);
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('Usuario autenticado, mostrando:', location.pathname);
  return <>{children}</>;
};

export default ProtectedRoute;