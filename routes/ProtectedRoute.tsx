import { Navigate } from "react-router-dom";
import { useAuth } from "../src/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // o spinner

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;