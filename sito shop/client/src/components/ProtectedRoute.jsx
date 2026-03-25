import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ adminOnly = false, children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="page"><p>Caricamento...</p></div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}
