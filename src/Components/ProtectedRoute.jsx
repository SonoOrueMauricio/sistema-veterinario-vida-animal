import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Redirige a login si no hay sesión activa */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
